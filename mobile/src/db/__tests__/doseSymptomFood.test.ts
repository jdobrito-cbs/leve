import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { addDose, lastInjectionSite, latestDose, listDoses } from '../doseRepo';
import { addFoodLog, foodForDay, kcalDailyTotals, kcalForDay } from '../foodLogRepo';
import { addSymptom, symptomsForDay } from '../symptomRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('dose: latest, lista desc e último local de injeção', async () => {
  const db = makeDb() as never;
  await addDose(db, {
    medication: 'semaglutida',
    doseMg: 0.5,
    route: 'injecao',
    injectionSite: 'abdomen_e',
    at: new Date(2026, 6, 1),
  });
  await addDose(db, {
    medication: 'semaglutida',
    doseMg: 0.5,
    route: 'pilula',
    at: new Date(2026, 6, 5),
  });
  expect((await latestDose(db))?.route).toBe('pilula');
  expect(await lastInjectionSite(db)).toBe('abdomen_e');
  expect((await listDoses(db)).map((d) => d.route)).toEqual(['pilula', 'injecao']);
});

test('sintomas do dia', async () => {
  const db = makeDb() as never;
  await addSymptom(db, 'nausea', 3, new Date(2026, 6, 7, 9));
  await addSymptom(db, 'fadiga', 2, new Date(2026, 6, 6, 9));
  expect((await symptomsForDay(db, new Date(2026, 6, 7))).map((s) => s.kind)).toEqual(['nausea']);
});

test('refeições: kcal do dia e série', async () => {
  const db = makeDb() as never;
  await addFoodLog(db, { name: 'Arroz', portionGrams: 150, calories: 190, at: new Date(2026, 6, 7, 12) });
  await addFoodLog(db, { name: 'Café', calories: 60, at: new Date(2026, 6, 7, 8) });
  await addFoodLog(db, { name: 'Ontem', calories: 500, at: new Date(2026, 6, 6, 12) });
  expect(await kcalForDay(db, new Date(2026, 6, 7))).toBe(250);
  expect((await foodForDay(db, new Date(2026, 6, 7))).map((f) => f.name)).toEqual(['Café', 'Arroz']);
  const series = await kcalDailyTotals(db, 2, new Date(2026, 6, 7));
  expect(series.map((s) => s.kcal)).toEqual([500, 250]);
});
