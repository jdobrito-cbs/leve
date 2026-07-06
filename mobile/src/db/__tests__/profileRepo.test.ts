import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { acceptDisclaimer, getProfile } from '../profileRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('perfil inexistente retorna null', async () => {
  expect(await getProfile(makeDb() as never)).toBeNull();
});

test('aceite do disclaimer cria e persiste perfil', async () => {
  const db = makeDb() as never;
  const now = new Date('2026-07-06T12:00:00Z');
  await acceptDisclaimer(db, now);
  const p = await getProfile(db);
  expect(p?.disclaimerAcceptedAt).toBe(now.toISOString());
});
