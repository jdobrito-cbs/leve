import { and, desc, eq, gte, lt, sum } from 'drizzle-orm';
import { dayRangeUtc } from '@/core/datetime';
import type { AppDb } from './client';
import { gymLogs } from './schema';

export interface GymLog {
  id: number;
  exercise: string;
  kind: 'forca' | 'cardio';
  weightKg: number | null;
  sets: number | null;
  reps: number | null;
  minutes: number | null;
  kcal: number;
  loggedAt: string;
}

export type AddGymLogInput = Omit<GymLog, 'id' | 'loggedAt'> & { at: Date };

export async function addGymLog(db: AppDb, input: AddGymLogInput): Promise<void> {
  const { at, ...rest } = input;
  await db.insert(gymLogs).values({ ...rest, loggedAt: at.toISOString() });
}

export async function listGymLogs(db: AppDb, limit = 100): Promise<GymLog[]> {
  return (await db
    .select()
    .from(gymLogs)
    .orderBy(desc(gymLogs.loggedAt))
    .limit(limit)) as GymLog[];
}

export async function deleteGymLog(db: AppDb, id: number): Promise<void> {
  await db.delete(gymLogs).where(eq(gymLogs.id, id));
}

export async function gymKcalForDay(db: AppDb, day: Date): Promise<number> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({ total: sum(gymLogs.kcal) })
    .from(gymLogs)
    .where(and(gte(gymLogs.loggedAt, startIso), lt(gymLogs.loggedAt, endIso)));
  return Number(rows[0]?.total ?? 0);
}
