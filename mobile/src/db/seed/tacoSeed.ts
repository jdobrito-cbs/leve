import { eq, inArray, like } from 'drizzle-orm';
import { normalizeText } from '@/core/text';
import type { AppDb } from '../client';
import { foodItems } from '../schema';
import { getSetting, setSetting } from '../settingsRepo';
import regionais from './regionais.json';
import taco from './taco.json';

interface SeedFood {
  name: string;
  category: string | null;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  unit?: 'g' | 'ml';
  referencePortion?: string;
}

function toRows(foods: SeedFood[], source: string) {
  return foods.map((f) => ({
    name: f.name,
    nameNormalized: normalizeText(f.name),
    category: f.category,
    unit: f.unit ?? 'g',
    referencePortion: f.referencePortion ?? (f.unit === 'ml' ? '100 ml' : '100 g'),
    calories: f.kcal,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    fiberG: f.fiberG,
    source,
  }));
}

async function insertChunked(db: AppDb, rows: ReturnType<typeof toRows>): Promise<void> {
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(foodItems).values(rows.slice(i, i + 100));
  }
}

const SEED_PATCH_VERSION = 1;

const TACO_FIXES: { name: string; kcal: number; p: number; c: number; g: number; f: number }[] = [
  { name: 'Leite, de vaca, integral', kcal: 60, p: 3.2, c: 4.5, g: 3.3, f: 0 },
  { name: 'Leite, de vaca, desnatado, UHT', kcal: 34, p: 3.4, c: 5.0, g: 0.1, f: 0 },
  { name: 'Iogurte, sabor abacaxi', kcal: 99, p: 3.5, c: 14.6, g: 3.5, f: 0 },
];

const TACO_ML_NAMES = [
  'Leite, de vaca, integral',
  'Leite, de vaca, desnatado, UHT',
  'Leite, de vaca, achocolatado',
];

async function applySeedPatches(db: AppDb): Promise<void> {
  const applied = (await getSetting<number>(db, 'foodSeedPatchV')) ?? 0;
  if (applied >= SEED_PATCH_VERSION) return;

  const all = (await db
    .select({ id: foodItems.id, name: foodItems.name })
    .from(foodItems)) as { id: number; name: string }[];
  for (const row of all) {
    await db
      .update(foodItems)
      .set({ nameNormalized: normalizeText(row.name) })
      .where(eq(foodItems.id, row.id));
  }

  for (const fix of TACO_FIXES) {
    await db
      .update(foodItems)
      .set({ calories: fix.kcal, proteinG: fix.p, carbsG: fix.c, fatG: fix.g, fiberG: fix.f })
      .where(eq(foodItems.name, fix.name));
  }

  await db
    .update(foodItems)
    .set({ unit: 'ml', referencePortion: '100 ml' })
    .where(eq(foodItems.category, 'Bebidas (alcoólicas e não alcoólicas)'));
  await db
    .update(foodItems)
    .set({ unit: 'ml', referencePortion: '100 ml' })
    .where(inArray(foodItems.name, TACO_ML_NAMES));

  await db
    .update(foodItems)
    .set({ referencePortion: '1 fatia (60 g)' })
    .where(like(foodItems.name, 'Bolo, pronto%'));

  await setSetting(db, 'foodSeedPatchV', SEED_PATCH_VERSION);
}

export async function seedFoodItemsIfEmpty(db: AppDb): Promise<void> {
  const existing = await db.select({ id: foodItems.id }).from(foodItems).limit(1);
  if (existing.length === 0) {
    await insertChunked(db, toRows(taco as SeedFood[], 'taco'));
  }
  const regionalRows = await db
    .select({ id: foodItems.id })
    .from(foodItems)
    .where(eq(foodItems.source, 'regional'));
  if (regionalRows.length !== (regionais as SeedFood[]).length) {
    await db.delete(foodItems).where(eq(foodItems.source, 'regional'));
    await insertChunked(db, toRows(regionais as SeedFood[], 'regional'));
  }
  await applySeedPatches(db);
}
