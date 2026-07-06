import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { getSetting, setSetting } from '../settingsRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('get inexistente → null; set/get round-trip; overwrite', async () => {
  const db = makeDb() as never;
  expect(await getSetting(db, 'reminders')).toBeNull();
  await setSetting(db, 'reminders', { doseEnabled: true });
  expect(await getSetting(db, 'reminders')).toEqual({ doseEnabled: true });
  await setSetting(db, 'reminders', { doseEnabled: false });
  expect(await getSetting(db, 'reminders')).toEqual({ doseEnabled: false });
});
