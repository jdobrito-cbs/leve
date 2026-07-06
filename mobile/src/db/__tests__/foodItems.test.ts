import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { searchFoods } from '../foodItemsRepo';
import { seedFoodItemsIfEmpty } from '../seed/tacoSeed';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('seed popula uma vez e busca ignora acentos', async () => {
  const db = makeDb() as never;
  await seedFoodItemsIfEmpty(db);
  await seedFoodItemsIfEmpty(db); // idempotente
  const results = await searchFoods(db, 'feijao');
  expect(results.length).toBeGreaterThan(0);
  expect(results.length).toBeLessThanOrEqual(25);
  expect(results[0].calories).not.toBeNull();
  expect(await searchFoods(db, 'f')).toEqual([]); // query curta
});
