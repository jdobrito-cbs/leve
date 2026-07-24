import { and, desc, eq, gte, lt, sum } from 'drizzle-orm';
import type { AppDb } from './client';
import { workouts } from './schema';
import { dayRangeUtc } from '@/core/datetime';

export type WorkoutType = 'run' | 'walk' | 'other';
export type WorkoutSource = 'healthkit' | 'healthconnect' | 'gps';

export interface RoutePoint {
  lat: number;
  lng: number;
  t?: number;
}

export interface WorkoutInput {
  source: WorkoutSource;
  externalId: string | null;
  type: WorkoutType;
  startAt: string;
  endAt: string | null;
  durationSec: number | null;
  distanceM: number | null;
  calories: number | null;
  avgHr: number | null;
  route: RoutePoint[] | null;
}

export interface Workout extends Omit<WorkoutInput, 'route'> {
  id: number;
  route: RoutePoint[] | null;
  createdAt: string;
}

function rowToWorkout(r: typeof workouts.$inferSelect): Workout {
  return {
    id: r.id,
    source: r.source as WorkoutSource,
    externalId: r.externalId,
    type: (r.type as WorkoutType) ?? 'other',
    startAt: r.startAt,
    endAt: r.endAt,
    durationSec: r.durationSec,
    distanceM: r.distanceM,
    calories: r.calories,
    avgHr: r.avgHr,
    route: r.routeJson ? (JSON.parse(r.routeJson) as RoutePoint[]) : null,
    createdAt: r.createdAt,
  };
}

export async function upsertWorkout(db: AppDb, input: WorkoutInput): Promise<boolean> {
  const base = {
    source: input.source,
    externalId: input.externalId,
    type: input.type,
    startAt: input.startAt,
    endAt: input.endAt,
    durationSec: input.durationSec,
    distanceM: input.distanceM,
    calories: input.calories,
    avgHr: input.avgHr,
    routeJson: input.route ? JSON.stringify(input.route) : null,
  };
  if (input.externalId) {
    const existing = await db
      .select({ id: workouts.id })
      .from(workouts)
      .where(and(eq(workouts.source, input.source), eq(workouts.externalId, input.externalId)))
      .limit(1);
    if (existing.length > 0) {
      await db.update(workouts).set(base).where(eq(workouts.id, existing[0].id));
      return false;
    }
  }
  await db.insert(workouts).values({ ...base, createdAt: new Date().toISOString() });
  return true;
}

export async function listWorkouts(db: AppDb, limit = 50): Promise<Workout[]> {
  const rows = await db.select().from(workouts).orderBy(desc(workouts.startAt)).limit(limit);
  return rows.map(rowToWorkout);
}

export async function getWorkout(db: AppDb, id: number): Promise<Workout | null> {
  const rows = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
  return rows[0] ? rowToWorkout(rows[0]) : null;
}

export async function deleteWorkout(db: AppDb, id: number): Promise<void> {
  await db.delete(workouts).where(eq(workouts.id, id));
}

export async function setWorkoutHr(db: AppDb, id: number, avgHr: number): Promise<void> {
  await db.update(workouts).set({ avgHr }).where(eq(workouts.id, id));
}

export function paceSecPerKm(distanceM: number | null, durationSec: number | null): number | null {
  if (!distanceM || distanceM <= 0 || !durationSec || durationSec <= 0) return null;
  return durationSec / (distanceM / 1000);
}

export async function workoutKcalForDay(db: AppDb, day: Date): Promise<number> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({ total: sum(workouts.calories) })
    .from(workouts)
    .where(and(gte(workouts.startAt, startIso), lt(workouts.startAt, endIso)));
  return Math.round(Number(rows[0]?.total ?? 0));
}
