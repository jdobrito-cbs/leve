import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import { latestWeight, weightsSince } from '@/db/weightRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { latestMetrics } from '@/db/metricsRepo';
import type { HealthProvider } from '../HealthProvider';
import { autoSyncIfDue, importMetrics, importWeights, readTodaySteps } from '../healthSync';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

function fakeProvider(): HealthProvider {
  return {
    isAvailable: async () => true,
    requestPermissions: async () => true,
    readWeight: async () => [
      { kg: 95.5, takenAt: new Date('2026-06-01T10:00:00.000Z'), source: 'healthconnect' },
      { kg: 93.2, takenAt: new Date('2026-07-01T10:00:00.000Z'), source: 'healthconnect' },
    ],
    readSteps: async () => [{ count: 4200, date: '2026-07-07' }],
    readMetrics: async () => [
      { type: 'body_fat_pct', value: 31.4, takenAt: new Date('2026-07-01T08:00:00.000Z') },
      { type: 'sleep_hours', value: 6.5, takenAt: new Date('2026-07-01T07:00:00.000Z') },
    ],
  };
}

test('importWeights insere e reimportação não duplica', async () => {
  const db = makeDb() as never;
  const provider = fakeProvider();
  expect(await importWeights(db, provider)).toBe(2);
  expect(await importWeights(db, provider)).toBe(0);
  const all = await weightsSince(db, new Date(0));
  expect(all).toHaveLength(2);
  expect((await latestWeight(db))?.origin).toBe('healthconnect');
});

test('importMetrics insere com dedup e latestMetrics devolve o último de cada', async () => {
  const db = makeDb() as never;
  const provider = fakeProvider();
  expect(await importMetrics(db, provider)).toBe(2);
  expect(await importMetrics(db, provider)).toBe(0);
  const latest = await latestMetrics(db);
  expect(latest.get('body_fat_pct')?.value).toBe(31.4);
  expect(latest.get('sleep_hours')?.origin).not.toBe('manual');
});

test('autoSyncIfDue respeita conexão e throttle de 1h', async () => {
  const db = makeDb() as never;
  const provider = fakeProvider();
  expect(await autoSyncIfDue(db, provider)).toBe(false); // saúde não conectada
  await setSetting(db, 'health', { connected: true });
  expect(await autoSyncIfDue(db, provider)).toBe(true);
  expect(await getSetting(db, 'lastHealthSyncAt')).not.toBeNull();
  expect(await autoSyncIfDue(db, provider)).toBe(false); // dentro da 1h
});

test('readTodaySteps devolve o total do dia ou null', async () => {
  expect(await readTodaySteps(fakeProvider(), new Date(2026, 6, 7))).toBe(4200);
  const empty: HealthProvider = {
    ...fakeProvider(),
    readSteps: async () => [],
    readMetrics: async () => [],
  };
  expect(await readTodaySteps(empty, new Date(2026, 6, 7))).toBeNull();
});
