import { asc, desc, eq, gte } from 'drizzle-orm';
import type { LogOrigin, WeightLog } from '@/core/types';
import type { AppDb } from './client';
import { weightLogs } from './schema';

export async function addWeight(
  db: AppDb,
  weightKg: number,
  at: Date,
  origin: LogOrigin = 'manual',
): Promise<void> {
  await db.insert(weightLogs).values({ weightKg, origin, loggedAt: at.toISOString() });
}

export async function latestWeight(db: AppDb): Promise<WeightLog | null> {
  const rows = await db.select().from(weightLogs).orderBy(desc(weightLogs.loggedAt)).limit(1);
  return (rows[0] as WeightLog | undefined) ?? null;
}

export async function firstWeight(db: AppDb): Promise<WeightLog | null> {
  const rows = await db.select().from(weightLogs).orderBy(asc(weightLogs.loggedAt)).limit(1);
  return (rows[0] as WeightLog | undefined) ?? null;
}

export async function listWeights(db: AppDb, limit = 100): Promise<WeightLog[]> {
  return (await db
    .select()
    .from(weightLogs)
    .orderBy(desc(weightLogs.loggedAt))
    .limit(limit)) as WeightLog[];
}

export async function deleteWeight(db: AppDb, id: number): Promise<void> {
  await db.delete(weightLogs).where(eq(weightLogs.id, id));
}

export async function weightsSince(db: AppDb, since: Date): Promise<WeightLog[]> {
  return (await db
    .select()
    .from(weightLogs)
    .where(gte(weightLogs.loggedAt, since.toISOString()))
    .orderBy(asc(weightLogs.loggedAt))) as WeightLog[];
}
