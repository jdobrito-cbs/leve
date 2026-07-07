import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DoseLog, DoseRoute } from '@/core/types';
import type { InjectionSite } from '@/features/dose/rotation';
import type { AppDb } from './client';
import { doseLogs } from './schema';

export interface AddDoseInput {
  medication: string;
  doseMg: number;
  route: DoseRoute;
  injectionSite?: InjectionSite | null;
  at: Date;
  nextDoseAt?: Date | null;
}

export async function addDose(db: AppDb, input: AddDoseInput): Promise<void> {
  await db.insert(doseLogs).values({
    medication: input.medication,
    doseMg: input.doseMg,
    route: input.route,
    injectionSite: input.injectionSite ?? null,
    loggedAt: input.at.toISOString(),
    nextDoseAt: input.nextDoseAt ? input.nextDoseAt.toISOString() : null,
  });
}

export async function latestDose(db: AppDb): Promise<DoseLog | null> {
  const rows = await db.select().from(doseLogs).orderBy(desc(doseLogs.loggedAt)).limit(1);
  return (rows[0] as DoseLog | undefined) ?? null;
}

export async function listDoses(db: AppDb, limit = 50): Promise<DoseLog[]> {
  return (await db
    .select()
    .from(doseLogs)
    .orderBy(desc(doseLogs.loggedAt))
    .limit(limit)) as DoseLog[];
}

export async function deleteDose(db: AppDb, id: number): Promise<void> {
  await db.delete(doseLogs).where(eq(doseLogs.id, id));
}

export async function lastInjectionSite(db: AppDb): Promise<InjectionSite | null> {
  const rows = await db
    .select({ site: doseLogs.injectionSite })
    .from(doseLogs)
    .where(and(eq(doseLogs.route, 'injecao'), isNotNull(doseLogs.injectionSite)))
    .orderBy(desc(doseLogs.loggedAt))
    .limit(1);
  return (rows[0]?.site as InjectionSite | undefined) ?? null;
}
