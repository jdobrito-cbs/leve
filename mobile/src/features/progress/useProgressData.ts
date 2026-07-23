import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import type { DoseLog, WeightLog } from '@/core/types';
import { db } from '@/db/client';
import { listDoses } from '@/db/doseRepo';
import { latestMetrics, type MetricRow } from '@/db/metricsRepo';
import { kcalDailyTotals } from '@/db/foodLogRepo';
import { waterDailyTotals } from '@/db/waterRepo';
import { weightsSince } from '@/db/weightRepo';
import { listWorkouts, type Workout } from '@/db/workoutRepo';

export interface ProgressData {
  loading: boolean;
  weights: WeightLog[];
  water7: { dayKey: string; totalMl: number }[];
  kcal7: { dayKey: string; kcal: number }[];
  doses: DoseLog[];
  metrics: MetricRow[];
  workouts: Workout[];
  refresh: () => Promise<void>;
}

export function useProgressData(): ProgressData {
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [water7, setWater7] = useState<{ dayKey: string; totalMl: number }[]>([]);
  const [kcal7, setKcal7] = useState<{ dayKey: string; kcal: number }[]>([]);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const refresh = useCallback(async () => {
    const now = new Date();
    const [w, wa, kc, ds, met, wk] = await Promise.all([
      weightsSince(db, new Date(0)),
      waterDailyTotals(db, 7, now),
      kcalDailyTotals(db, 7, now),
      listDoses(db, 20),
      latestMetrics(db),
      listWorkouts(db, 5),
    ]);
    setWeights(w);
    setWater7(wa);
    setKcal7(kc);
    setDoses(ds);
    setMetrics([...met.values()]);
    setWorkouts(wk);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { loading, weights, water7, kcal7, doses, metrics, workouts, refresh };
}
