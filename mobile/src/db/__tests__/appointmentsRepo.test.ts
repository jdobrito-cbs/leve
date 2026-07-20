import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { addAppointment, deleteAppointment, listAppointments } from '../appointmentsRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db as never;
}

test('agenda, lista em ordem cronológica e apaga consultas (erradas ou passadas)', async () => {
  const db = makeDb();
  await addAppointment(db, {
    place: 'Clínica Vida',
    specialty: 'Cardiologia',
    doctor: 'Dra. Ana',
    at: new Date(2026, 7, 20, 14, 30),
  });
  await addAppointment(db, {
    place: 'HGE',
    specialty: 'Ortopedia',
    at: new Date(2026, 7, 10, 9, 0),
  });

  const list = await listAppointments(db);
  expect(list).toHaveLength(2);
  expect(list[0].place).toBe('HGE');
  expect(list[1].doctor).toBe('Dra. Ana');

  await deleteAppointment(db, list[0].id);
  expect(await listAppointments(db)).toHaveLength(1);
});
