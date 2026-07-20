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
  expect((await searchFoods(db, 'ovinha')).map((f) => f.name)).toContain('Farinha ovinha');
});

test('doces tradicionais e regionais são encontrados por nome popular', async () => {
  const db = makeDb() as never;
  await seedFoodItemsIfEmpty(db);
  expect((await searchFoods(db, 'goiabada')).map((f) => f.name)).toContain('Goiabada');
  expect((await searchFoods(db, 'bananada')).length).toBeGreaterThan(0);
  // Busca por palavras alcança também o nome com vírgulas da TACO.
  const doceDeLeite = (await searchFoods(db, 'doce de leite')).map((f) => f.name);
  expect(doceDeLeite).toContain('Doce de leite');
  expect(doceDeLeite).toContain('Doce, de leite, cremoso');
  expect((await searchFoods(db, 'pudim')).map((f) => f.name)).toContain(
    'Pudim de leite condensado',
  );
  expect((await searchFoods(db, 'torta de limão')).length).toBeGreaterThan(0);
  expect((await searchFoods(db, 'mousse')).length).toBeGreaterThan(0);
  expect((await searchFoods(db, 'brigadeiro'))[0]?.calories).toBe(335);
  const fatia = (await searchFoods(db, 'bolo de cenoura'))[0];
  expect(fatia?.referencePortion).toBe('1 fatia (60 g)');
});

test('bebidas ficam em ml e as marcas comuns são encontradas', async () => {
  const db = makeDb() as never;
  await seedFoodItemsIfEmpty(db);
  const coca = await searchFoods(db, 'coca cola');
  expect(coca.length).toBeGreaterThanOrEqual(2); // normal e zero
  expect(coca.every((f) => f.unit === 'ml')).toBe(true);
  expect((await searchFoods(db, 'cachaça'))[0]?.unit).toBe('ml');
  expect((await searchFoods(db, 'vinho')).length).toBeGreaterThan(0);
  expect((await searchFoods(db, 'suco de cupuaçu'))[0]?.calories).toBe(25);
  // Patch idempotente: TACO líquidos corrigidos e em ml.
  const leite = (await searchFoods(db, 'leite de vaca integral')).find(
    (f) => f.name === 'Leite, de vaca, integral',
  );
  expect(leite?.unit).toBe('ml');
  expect(leite?.calories).toBe(60); // estava zerado na base original
  const cerveja = (await searchFoods(db, 'cerveja')).find((f) => f.name.startsWith('Cerveja, pilsen'));
  expect(cerveja?.unit).toBe('ml');
});

test('frutas regionais e seus sucos entram no seed', async () => {
  const db = makeDb() as never;
  await seedFoodItemsIfEmpty(db);
  // Frutas nomeadas pelo usuário e outras amazônicas/nordestinas.
  expect((await searchFoods(db, 'graviola')).map((f) => f.name)).toContain('Graviola');
  expect((await searchFoods(db, 'taperebá')).length).toBeGreaterThan(0); // cajá
  expect((await searchFoods(db, 'seriguela')).length).toBeGreaterThan(0);
  expect((await searchFoods(db, 'umbu')).length).toBeGreaterThan(0);
  // Sucos regionais ficam em ml.
  const sucoGraviola = (await searchFoods(db, 'suco de graviola'))[0];
  expect(sucoGraviola?.unit).toBe('ml');
  expect(sucoGraviola?.calories).toBe(52);
  expect((await searchFoods(db, 'suco de cajá'))[0]?.unit).toBe('ml');
});
