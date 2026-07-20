import { and, asc, like } from 'drizzle-orm';
import { normalizeText } from '@/core/text';
import type { FoodItem } from '@/core/types';
import type { AppDb } from './client';
import { foodItems } from './schema';

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'com', 'em', 'a', 'o', 'no', 'na']);

export async function searchFoods(db: AppDb, query: string): Promise<FoodItem[]> {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  let tokens = q.split(' ').filter((t) => t.length > 0 && !STOPWORDS.has(t));
  if (tokens.length === 0) tokens = [q];
  const rows = await db
    .select()
    .from(foodItems)
    .where(and(...tokens.map((t) => like(foodItems.nameNormalized, `%${t}%`))))
    .orderBy(asc(foodItems.name))
    .limit(25);
  return rows.map(({ nameNormalized: _ignored, ...item }) => item as FoodItem);
}
