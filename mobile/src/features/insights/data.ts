import { lastNDays } from '@/core/datetime';
import type { AppDb } from '@/db/client';
import { metricSeries } from '@/db/metricsRepo';
import { waterDailyTotals } from '@/db/waterRepo';
import { weightsSince } from '@/db/weightRepo';
import { getEffectiveWaterGoal } from '@/features/water/waterGoal';
import type { InsightInput, Point } from './insights';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function buildInsightInput(db: AppDb): Promise<InsightInput> {
  const since28 = daysAgo(28);
  const [weights, fat, skeletal, muscle, lean, water, sleep, hr, waterDays, goal] =
    await Promise.all([
      weightsSince(db, since28),
      metricSeries(db, 'body_fat_pct', since28),
      metricSeries(db, 'skeletal_muscle_kg', since28),
      metricSeries(db, 'muscle_mass_kg', since28),
      metricSeries(db, 'lean_mass_kg', since28),
      metricSeries(db, 'body_water_kg', since28),
      metricSeries(db, 'sleep_hours', daysAgo(7)),
      metricSeries(db, 'heart_rate_resting', daysAgo(30)),
      waterDailyTotals(db, 7, new Date()),
      getEffectiveWaterGoal(db),
    ]);

  const musclePref: Point[] = (skeletal.length ? skeletal : muscle.length ? muscle : lean).map(
    (m) => ({ value: m.value }),
  );
  const cut7 = daysAgo(7).toISOString();
  const waterPast = waterDays.slice(0, -1);

  return {
    weights28: weights.map((w) => ({ value: w.weightKg })),
    bodyFat28: fat.map((m) => ({ value: m.value })),
    muscle28: musclePref,
    bodyWater28: water.map((m) => ({ value: m.value })),
    sleep7: sleep.map((m) => m.value),
    restingHr7: hr.filter((m) => m.loggedAt >= cut7).map((m) => m.value),
    restingHr30: hr.filter((m) => m.loggedAt < cut7).map((m) => m.value),
    waterPctOfGoal7: goal.goalMl > 0 ? waterPast.map((d) => d.totalMl / goal.goalMl) : [],
  };
}

export { lastNDays };
