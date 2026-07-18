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

test('pratos regionais entram no seed e são encontrados por termos do dia a dia', async () => {
  const db = makeDb() as never;
  await seedFoodItemsIfEmpty(db);
  await seedFoodItemsIfEmpty(db); // idempotente também para os regionais
  const picadinho = await searchFoods(db, 'picadinho');
  expect(picadinho.map((f) => f.name)).toContain('Picadinho de carne bovina');
  const bife = await searchFoods(db, 'bife');
  expect(bife.length).toBeGreaterThanOrEqual(2); // alcatra e contra-filé
  const calabresa = await searchFoods(db, 'feijao preto com calabresa');
  expect(calabresa[0]?.calories).toBe(118);
  const carneSol = await searchFoods(db, 'carne de sol');
  expect(carneSol.length).toBeGreaterThan(0);
  // ampliação nortista
  const farofa = await searchFoods(db, 'farofa simples');
  expect(farofa.map((f) => f.name)).toContain('Farofa simples (de mandioca)');
  expect((await searchFoods(db, 'pirarucu')).length).toBeGreaterThanOrEqual(2);
  expect((await searchFoods(db, 'farinha')).length).toBeGreaterThan(3);
  expect((await searchFoods(db, 'tambaqui')).length).toBeGreaterThan(0);
});
