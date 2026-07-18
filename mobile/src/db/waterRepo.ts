import { and, desc, gte, lt, sum } from 'drizzle-orm';
import { dayRangeUtc, lastNDays, localDayKey } from '@/core/datetime';
import type { AppDb } from './client';
import { waterLogs } from './schema';

export async function addWater(db: AppDb, amountMl: number, at: Date): Promise<void> {
  await db.insert(waterLogs).values({ amountMl, loggedAt: at.toISOString() });
}

export async function waterTotalForDay(db: AppDb, day: Date): Promise<number> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({ total: sum(waterLogs.amountMl) })
    .from(waterLogs)
    .where(and(gte(waterLogs.loggedAt, startIso), lt(waterLogs.loggedAt, endIso)));
  return Number(rows[0]?.total ?? 0);
}

/** Horário do último registro de água do dia (para o mascote reagir ao gole). */
export async function latestWaterAt(db: AppDb, day: Date): Promise<string | null> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({ loggedAt: waterLogs.loggedAt })
    .from(waterLogs)
    .where(and(gte(waterLogs.loggedAt, startIso), lt(waterLogs.loggedAt, endIso)))
    .orderBy(desc(waterLogs.loggedAt))
    .limit(1);
  return rows[0]?.loggedAt ?? null;
}

export async function waterDailyTotals(
  db: AppDb,
  days: number,
  today: Date,
): Promise<{ dayKey: string; totalMl: number }[]> {
  const result: { dayKey: string; totalMl: number }[] = [];
  for (const day of lastNDays(days, today)) {
    result.push({ dayKey: localDayKey(day), totalMl: await waterTotalForDay(db, day) });
  }
  return result;
}
