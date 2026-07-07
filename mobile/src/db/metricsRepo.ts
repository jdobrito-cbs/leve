import { and, asc, desc, eq, gte, inArray, ne } from 'drizzle-orm';
import { METRIC_DEFS, MetricType } from '@/core/metrics';
import type { LogOrigin } from '@/core/types';
import type { AppDb } from './client';
import { healthMetrics } from './schema';

export interface MetricRow {
  id: number;
  type: MetricType;
  value: number;
  unit: string;
  origin: string;
  loggedAt: string;
}

export async function addMetric(
  db: AppDb,
  type: MetricType,
  value: number,
  at: Date,
  origin: LogOrigin = 'manual',
): Promise<void> {
  await db.insert(healthMetrics).values({
    type,
    value,
    unit: METRIC_DEFS[type].unit,
    origin,
    loggedAt: at.toISOString(),
  });
}

/** Último valor de cada métrica que tiver algum registro. */
export async function latestMetrics(db: AppDb): Promise<Map<MetricType, MetricRow>> {
  const rows = (await db
    .select()
    .from(healthMetrics)
    .orderBy(asc(healthMetrics.loggedAt))) as MetricRow[];
  const map = new Map<MetricType, MetricRow>();
  for (const row of rows) map.set(row.type, row);
  return map;
}

/** Registros manuais dos tipos indicados, do mais recente ao mais antigo. */
export async function listManualMetrics(
  db: AppDb,
  types: readonly MetricType[],
  limit = 100,
): Promise<MetricRow[]> {
  return (await db
    .select()
    .from(healthMetrics)
    .where(and(inArray(healthMetrics.type, [...types]), eq(healthMetrics.origin, 'manual')))
    .orderBy(desc(healthMetrics.loggedAt))
    .limit(limit)) as MetricRow[];
}

export async function deleteMetric(db: AppDb, id: number): Promise<void> {
  await db.delete(healthMetrics).where(eq(healthMetrics.id, id));
}

export async function metricSeries(
  db: AppDb,
  type: MetricType,
  since: Date,
): Promise<MetricRow[]> {
  return (await db
    .select()
    .from(healthMetrics)
    .where(and(eq(healthMetrics.type, type), gte(healthMetrics.loggedAt, since.toISOString())))
    .orderBy(asc(healthMetrics.loggedAt))) as MetricRow[];
}

/** Chaves 'type|loggedAt' das métricas importadas de plataformas de saúde (para dedup). */
export async function importedMetricKeys(db: AppDb): Promise<Set<string>> {
  const rows = await db
    .select({ type: healthMetrics.type, loggedAt: healthMetrics.loggedAt })
    .from(healthMetrics)
    .where(ne(healthMetrics.origin, 'manual'));
  return new Set(rows.map((r) => `${r.type}|${r.loggedAt}`));
}

export async function latestMetric(db: AppDb, type: MetricType): Promise<MetricRow | null> {
  const rows = await db
    .select()
    .from(healthMetrics)
    .where(eq(healthMetrics.type, type))
    .orderBy(desc(healthMetrics.loggedAt))
    .limit(1);
  return (rows[0] as MetricRow | undefined) ?? null;
}
