import { and, asc, gte, lt } from 'drizzle-orm';
import { dayRangeUtc } from '@/core/datetime';
import type { SymptomLog } from '@/core/types';
import type { AppDb } from './client';
import { symptomLogs } from './schema';

export async function addSymptom(
  db: AppDb,
  kind: string,
  intensity: number,
  at: Date,
): Promise<void> {
  await db.insert(symptomLogs).values({ kind, intensity, loggedAt: at.toISOString() });
}

export async function symptomsForDay(db: AppDb, day: Date): Promise<SymptomLog[]> {
  const { startIso, endIso } = dayRangeUtc(day);
  return (await db
    .select()
    .from(symptomLogs)
    .where(and(gte(symptomLogs.loggedAt, startIso), lt(symptomLogs.loggedAt, endIso)))
    .orderBy(asc(symptomLogs.loggedAt))) as SymptomLog[];
}
