import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import { latestWeight, weightsSince } from '@/db/weightRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { latestMetrics } from '@/db/metricsRepo';
import type { HealthProvider } from '../HealthProvider';
import {
  autoSyncIfDue,
  detectSleepSchedule,
  importMetrics,
  importWeights,
  readTodaySteps,
} from '../healthSync';

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
    readSleepNights: async () => [],
    readStepsWindow: async () => null,
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

test('autoSyncIfDue exige premium e respeita conexão e throttle de 1h', async () => {
  const db = makeDb() as never;
  const provider = fakeProvider();
  await setSetting(db, 'health', { connected: true });
  expect(await autoSyncIfDue(db, provider)).toBe(false);
  await setSetting(db, 'entitlement', { plan: 'partner' });
  await setSetting(db, 'health', { connected: false });
  expect(await autoSyncIfDue(db, provider)).toBe(false);
  await setSetting(db, 'health', { connected: true });
  expect(await autoSyncIfDue(db, provider)).toBe(true);
  expect(await getSetting(db, 'lastHealthSyncAt')).not.toBeNull();
  expect(await autoSyncIfDue(db, provider)).toBe(false);
});

test('detectSleepSchedule guarda sugestões e atualiza lembrete automático', async () => {
  const db = makeDb() as never;
  const provider: HealthProvider = {
    ...fakeProvider(),
    readSleepNights: async () => [
      { start: new Date(2026, 6, 10, 22, 55), end: new Date(2026, 6, 11, 6, 55) },
      { start: new Date(2026, 6, 11, 23, 0), end: new Date(2026, 6, 12, 7, 0) },
      { start: new Date(2026, 6, 12, 23, 5), end: new Date(2026, 6, 13, 7, 5) },
      { start: new Date(2026, 6, 13, 23, 0), end: new Date(2026, 6, 14, 7, 0) },
    ],
  };
  await setSetting(db, 'reminders', {
    doseEnabled: false,
    waterEnabled: false,
    waterTimes: [],
    sleepEnabled: true,
    sleepAuto: true,
    wakeEnabled: true,
    wakeAuto: false,
    wakeTime: '06:00',
  });
  await detectSleepSchedule(db, provider);
  expect(await getSetting(db, 'sleepBedtimeDetected')).toBe('23:00');
  expect(await getSetting(db, 'sleepWakeDetected')).toBe('07:00');
  const r = await getSetting<{ sleepTime?: string; wakeTime?: string }>(db, 'reminders');
  expect(r?.sleepTime).toBe('23:00');
  expect(r?.wakeTime).toBe('06:00');
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
