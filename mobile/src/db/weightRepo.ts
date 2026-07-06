import { asc, desc, gte } from 'drizzle-orm';
import type { WeightLog } from '@/core/types';
import type { AppDb } from './client';
import { weightLogs } from './schema';

export async function addWeight(db: AppDb, weightKg: number, at: Date): Promise<void> {
  await db.insert(weightLogs).values({ weightKg, origin: 'manual', loggedAt: at.toISOString() });
}

export async function latestWeight(db: AppDb): Promise<WeightLog | null> {
  const rows = await db.select().from(weightLogs).orderBy(desc(weightLogs.loggedAt)).limit(1);
  return (rows[0] as WeightLog | undefined) ?? null;
}

export async function weightsSince(db: AppDb, since: Date): Promise<WeightLog[]> {
  return (await db
    .select()
    .from(weightLogs)
    .where(gte(weightLogs.loggedAt, since.toISOString()))
    .orderBy(asc(weightLogs.loggedAt))) as WeightLog[];
}
