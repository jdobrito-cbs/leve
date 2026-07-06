import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { acceptDisclaimer, getProfile, updateProfile } from '../profileRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('perfil inexistente retorna null', async () => {
  expect(await getProfile(makeDb() as never)).toBeNull();
});

test('updateProfile cria perfil se não existe e atualiza campos', async () => {
  const db = makeDb() as never;
  await updateProfile(db, { name: 'Jorge', waterGoalMl: 2500 });
  let p = await getProfile(db);
  expect(p?.name).toBe('Jorge');
  expect(p?.waterGoalMl).toBe(2500);
  await updateProfile(db, { heightCm: 178 });
  p = await getProfile(db);
  expect(p?.heightCm).toBe(178);
  expect(p?.name).toBe('Jorge');
});

test('aceite do disclaimer cria e persiste perfil', async () => {
  const db = makeDb() as never;
  const now = new Date('2026-07-06T12:00:00Z');
  await acceptDisclaimer(db, now);
  const p = await getProfile(db);
  expect(p?.disclaimerAcceptedAt).toBe(now.toISOString());
});
