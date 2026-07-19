import { desc, isNull , eq } from 'drizzle-orm';
import type { AppDb } from '@/db/client';
import { periodLogs } from '@/db/schema';

export interface PeriodLog {
  id: number;
  startedAt: string;
  endedAt: string | null;
  flow: string | null;
}

export async function openPeriod(db: AppDb): Promise<PeriodLog | null> {
  const rows = await db
    .select()
    .from(periodLogs)
    .where(isNull(periodLogs.endedAt))
    .orderBy(desc(periodLogs.startedAt))
    .limit(1);
  return (rows[0] as PeriodLog | undefined) ?? null;
}

export async function startPeriod(db: AppDb, at: Date, flow?: string): Promise<void> {
  if (await openPeriod(db)) return; // já em andamento
  await db.insert(periodLogs).values({ startedAt: at.toISOString(), flow: flow ?? null });
}

export async function endPeriod(db: AppDb, at: Date): Promise<void> {
  const open = await openPeriod(db);
  if (!open) return;
  await db.update(periodLogs).set({ endedAt: at.toISOString() }).where(eq(periodLogs.id, open.id));
}

export async function setFlow(db: AppDb, flow: string): Promise<void> {
  const open = await openPeriod(db);
  if (!open) return;
  await db.update(periodLogs).set({ flow }).where(eq(periodLogs.id, open.id));
}

/** Apaga um ciclo registrado por engano (aberto ou já encerrado). */
export async function deletePeriod(db: AppDb, id: number): Promise<void> {
  await db.delete(periodLogs).where(eq(periodLogs.id, id));
}

export async function listPeriods(db: AppDb, limit = 12): Promise<PeriodLog[]> {
  return (await db
    .select()
    .from(periodLogs)
    .orderBy(desc(periodLogs.startedAt))
    .limit(limit)) as PeriodLog[];
}

/** Previsão informativa da próxima menstruação pela média dos últimos ciclos (mín. 2 inícios). */
export function predictNextPeriod(
  periods: PeriodLog[],
): { expectedAt: Date; avgCycleDays: number } | null {
  const starts = [...periods]
    .map((p) => new Date(p.startedAt).getTime())
    .sort((a, b) => a - b)
    .slice(-6);
  if (starts.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) gaps.push((starts[i] - starts[i - 1]) / 86400000);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg < 15 || avg > 60) return null; // fora de faixa plausível — sem previsão
  return {
    expectedAt: new Date(starts[starts.length - 1] + avg * 86400000),
    avgCycleDays: Math.round(avg),
  };
}
