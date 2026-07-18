import { eq } from 'drizzle-orm';
import { normalizeText } from '@/core/text';
import type { AppDb } from '../client';
import { foodItems } from '../schema';
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
}

function toRows(foods: SeedFood[], source: string) {
  return foods.map((f) => ({
    name: f.name,
    nameNormalized: normalizeText(f.name),
    category: f.category,
    referencePortion: '100 g',
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

export async function seedFoodItemsIfEmpty(db: AppDb): Promise<void> {
  const existing = await db.select({ id: foodItems.id }).from(foodItems).limit(1);
  if (existing.length === 0) {
    await insertChunked(db, toRows(taco as SeedFood[], 'taco'));
  }
  // Pratos regionais: quando a lista cresce, re-semeia para chegar
  // também a instalações antigas (compara pela quantidade).
  const regionalRows = await db
    .select({ id: foodItems.id })
    .from(foodItems)
    .where(eq(foodItems.source, 'regional'));
  if (regionalRows.length !== (regionais as SeedFood[]).length) {
    await db.delete(foodItems).where(eq(foodItems.source, 'regional'));
    await insertChunked(db, toRows(regionais as SeedFood[], 'regional'));
  }
}
