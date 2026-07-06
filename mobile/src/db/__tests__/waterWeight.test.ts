import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { addWater, waterDailyTotals, waterTotalForDay } from '../waterRepo';
import { addWeight, latestWeight, weightsSince } from '../weightRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('água: total do dia e série diária', async () => {
  const db = makeDb() as never;
  const today = new Date(2026, 6, 7, 10, 0);
  const yesterday = new Date(2026, 6, 6, 10, 0);
  await addWater(db, 200, today);
  await addWater(db, 300, today);
  await addWater(db, 500, yesterday);
  expect(await waterTotalForDay(db, today)).toBe(500);
  const series = await waterDailyTotals(db, 2, today);
  expect(series).toEqual([
    { dayKey: '2026-07-06', totalMl: 500 },
    { dayKey: '2026-07-07', totalMl: 500 },
  ]);
});

test('peso: latest e série', async () => {
  const db = makeDb() as never;
  await addWeight(db, 95.5, new Date(2026, 5, 1));
  await addWeight(db, 93.2, new Date(2026, 6, 1));
  expect((await latestWeight(db))?.weightKg).toBe(93.2);
  const series = await weightsSince(db, new Date(2026, 4, 1));
  expect(series.map((w) => w.weightKg)).toEqual([95.5, 93.2]);
});
