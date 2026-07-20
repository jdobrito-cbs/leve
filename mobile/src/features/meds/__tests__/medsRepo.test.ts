import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import {
  addMedication,
  adherence,
  deactivateMedication,
  listMedications,
  markTaken,
  timesForDailyCount,
  todayIntakes,
} from '../medsRepo';

test('horários automáticos dividem as 24h a partir das 08:00', () => {
  expect(timesForDailyCount(1)).toEqual(['08:00']);
  expect(timesForDailyCount(2)).toEqual(['08:00', '20:00']);
  expect(timesForDailyCount(3)).toEqual(['00:00', '08:00', '16:00']);
  expect(timesForDailyCount(4)).toEqual(['02:00', '08:00', '14:00', '20:00']);
  expect(timesForDailyCount(12)).toHaveLength(12);
  expect(timesForDailyCount(8).every((t) => /^\d{2}:\d{2}$/.test(t))).toBe(true);
});

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('tomadas do dia são criadas uma vez, marcadas e contadas na adesão', async () => {
  const db = makeDb() as never;
  const day = new Date(2026, 6, 7, 9);
  await addMedication(db, { name: 'Metformina', doseText: '850 mg', times: ['08:00', '20:00'] });
  await addMedication(db, { name: 'Vitamina D', times: ['08:00'] });

  let intakes = await todayIntakes(db, day);
  expect(intakes).toHaveLength(3);
  intakes = await todayIntakes(db, day);
  expect(intakes).toHaveLength(3);

  await markTaken(db, intakes[0].intakeId, day);
  const after = await todayIntakes(db, day);
  expect(after.filter((i) => i.takenAt).length).toBe(1);
  expect(await adherence(db, 7, day)).toEqual({ taken: 1, total: 3 });

  const meds = await listMedications(db);
  await deactivateMedication(db, meds[0].id);
  expect((await listMedications(db)).map((m) => m.name)).toEqual(['Vitamina D']);
});
