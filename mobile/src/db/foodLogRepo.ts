import { and, asc, gte, lt, sum } from 'drizzle-orm';
import { dayRangeUtc, lastNDays, localDayKey } from '@/core/datetime';
import type { FoodLog, LogOrigin } from '@/core/types';
import type { AppDb } from './client';
import { foodLogs } from './schema';

export interface AddFoodLogInput {
  name: string;
  portionGrams?: number | null;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
  origin?: LogOrigin;
  at: Date;
}

export async function addFoodLog(db: AppDb, input: AddFoodLogInput): Promise<void> {
  await db.insert(foodLogs).values({
    name: input.name,
    portionGrams: input.portionGrams ?? null,
    calories: input.calories ?? null,
    proteinG: input.proteinG ?? null,
    carbsG: input.carbsG ?? null,
    fatG: input.fatG ?? null,
    fiberG: input.fiberG ?? null,
    origin: input.origin ?? 'manual',
    photoUri: null,
    loggedAt: input.at.toISOString(),
  });
}

export async function foodForDay(db: AppDb, day: Date): Promise<FoodLog[]> {
  const { startIso, endIso } = dayRangeUtc(day);
  return (await db
    .select()
    .from(foodLogs)
    .where(and(gte(foodLogs.loggedAt, startIso), lt(foodLogs.loggedAt, endIso)))
    .orderBy(asc(foodLogs.loggedAt))) as FoodLog[];
}

export interface DayMacros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

/** Totais nutricionais do dia (refeição diária). */
export async function macrosForDay(db: AppDb, day: Date): Promise<DayMacros> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({
      kcal: sum(foodLogs.calories),
      proteinG: sum(foodLogs.proteinG),
      carbsG: sum(foodLogs.carbsG),
      fatG: sum(foodLogs.fatG),
      fiberG: sum(foodLogs.fiberG),
    })
    .from(foodLogs)
    .where(and(gte(foodLogs.loggedAt, startIso), lt(foodLogs.loggedAt, endIso)));
  const r = rows[0];
  return {
    kcal: Number(r?.kcal ?? 0),
    proteinG: Number(r?.proteinG ?? 0),
    carbsG: Number(r?.carbsG ?? 0),
    fatG: Number(r?.fatG ?? 0),
    fiberG: Number(r?.fiberG ?? 0),
  };
}

export async function kcalForDay(db: AppDb, day: Date): Promise<number> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({ total: sum(foodLogs.calories) })
    .from(foodLogs)
    .where(and(gte(foodLogs.loggedAt, startIso), lt(foodLogs.loggedAt, endIso)));
  return Number(rows[0]?.total ?? 0);
}

export async function kcalDailyTotals(
  db: AppDb,
  days: number,
  today: Date,
): Promise<{ dayKey: string; kcal: number }[]> {
  const result: { dayKey: string; kcal: number }[] = [];
  for (const day of lastNDays(days, today)) {
    result.push({ dayKey: localDayKey(day), kcal: await kcalForDay(db, day) });
  }
  return result;
}
