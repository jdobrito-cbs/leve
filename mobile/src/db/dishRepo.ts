import { asc, desc, eq } from 'drizzle-orm';
import type { PortionUnit } from '@/core/types';
import type { AppDb } from './client';
import { dishItems, dishes } from './schema';

export interface DishItem {
  id: number;
  dishId: number;
  name: string;
  grams: number | null;
  unit: PortionUnit;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
}

export type DishItemInput = Omit<DishItem, 'id' | 'dishId'>;

export interface Dish {
  id: number;
  name: string;
  createdAt: string;
  items: DishItem[];
}

export async function saveDish(
  db: AppDb,
  name: string,
  items: DishItemInput[],
  createdAt: Date,
): Promise<void> {
  await db.insert(dishes).values({ name, createdAt: createdAt.toISOString() });
  const rows = await db.select({ id: dishes.id }).from(dishes).orderBy(desc(dishes.id)).limit(1);
  const dishId = rows[0].id;
  for (const item of items) {
    await db.insert(dishItems).values({ ...item, dishId });
  }
}

export async function listDishes(db: AppDb): Promise<Dish[]> {
  const [all, items] = await Promise.all([
    db.select().from(dishes).orderBy(desc(dishes.createdAt)),
    db.select().from(dishItems).orderBy(asc(dishItems.id)),
  ]);
  return (all as Omit<Dish, 'items'>[]).map((d) => ({
    ...d,
    items: (items as DishItem[]).filter((i) => i.dishId === d.id),
  }));
}

export async function deleteDish(db: AppDb, id: number): Promise<void> {
  await db.delete(dishItems).where(eq(dishItems.dishId, id));
  await db.delete(dishes).where(eq(dishes.id, id));
}
