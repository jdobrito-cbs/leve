import { asc, like } from 'drizzle-orm';
import { normalizeText } from '@/core/text';
import type { FoodItem } from '@/core/types';
import type { AppDb } from './client';
import { foodItems } from './schema';

export async function searchFoods(db: AppDb, query: string): Promise<FoodItem[]> {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const rows = await db
    .select()
    .from(foodItems)
    .where(like(foodItems.nameNormalized, `%${q}%`))
    .orderBy(asc(foodItems.name))
    .limit(25);
  return rows.map(({ nameNormalized: _ignored, ...item }) => item as FoodItem);
}
