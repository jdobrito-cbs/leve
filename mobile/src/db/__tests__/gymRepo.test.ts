import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { addGymLog, deleteGymLog, gymKcalForDay, listGymLogs } from '../gymRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db as never;
}

test('registra, lista (desc), soma o dia e apaga exercícios', async () => {
  const db = makeDb();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  await addGymLog(db, {
    exercise: 'supino',
    kind: 'forca',
    weightKg: 40,
    sets: 3,
    reps: 12,
    minutes: null,
    kcal: 61,
    at: today,
  });
  await addGymLog(db, {
    exercise: 'danca',
    kind: 'cardio',
    weightKg: null,
    sets: null,
    reps: null,
    minutes: 45,
    kcal: 340,
    at: new Date(today.getTime() + 60_000),
  });

  const list = await listGymLogs(db);
  expect(list).toHaveLength(2);
  expect(list[0].exercise).toBe('danca');
  expect(await gymKcalForDay(db, today)).toBe(401);

  await deleteGymLog(db, list[0].id);
  expect(await listGymLogs(db)).toHaveLength(1);
  expect(await gymKcalForDay(db, today)).toBe(61);
});
