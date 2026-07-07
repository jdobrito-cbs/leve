import { normalizeText } from '@/core/text';
import type { AppDb } from '../client';
import { foodItems } from '../schema';
import taco from './taco.json';

interface TacoFood {
  name: string;
  category: string | null;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
}

export async function seedFoodItemsIfEmpty(db: AppDb): Promise<void> {
  const existing = await db.select({ id: foodItems.id }).from(foodItems).limit(1);
  if (existing.length > 0) return;
  const rows = (taco as TacoFood[]).map((f) => ({
    name: f.name,
    nameNormalized: normalizeText(f.name),
    category: f.category,
    referencePortion: '100 g',
    calories: f.kcal,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    fiberG: f.fiberG,
    source: 'taco',
  }));
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(foodItems).values(rows.slice(i, i + 100));
  }
}
