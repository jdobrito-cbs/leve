import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import { latestWeight, weightsSince } from '@/db/weightRepo';
import type { HealthProvider } from '../HealthProvider';
import { importWeights, readTodaySteps } from '../healthSync';

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

test('readTodaySteps devolve o total do dia ou null', async () => {
  expect(await readTodaySteps(fakeProvider(), new Date(2026, 6, 7))).toBe(4200);
  const empty: HealthProvider = {
    ...fakeProvider(),
    readSteps: async () => [],
  };
  expect(await readTodaySteps(empty, new Date(2026, 6, 7))).toBeNull();
});
