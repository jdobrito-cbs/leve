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
  todayIntakes,
} from '../medsRepo';

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
  intakes = await todayIntakes(db, day); // idempotente
  expect(intakes).toHaveLength(3);

  await markTaken(db, intakes[0].intakeId, day);
  const after = await todayIntakes(db, day);
  expect(after.filter((i) => i.takenAt).length).toBe(1);
  expect(await adherence(db, 7, day)).toEqual({ taken: 1, total: 3 });

  const meds = await listMedications(db);
  await deactivateMedication(db, meds[0].id);
  expect((await listMedications(db)).map((m) => m.name)).toEqual(['Vitamina D']);
});
