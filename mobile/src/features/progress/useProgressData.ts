import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import type { DoseLog, WeightLog } from '@/core/types';
import { db } from '@/db/client';
import { listDoses } from '@/db/doseRepo';
import { latestMetrics, type MetricRow } from '@/db/metricsRepo';
import { kcalDailyTotals } from '@/db/foodLogRepo';
import { waterDailyTotals } from '@/db/waterRepo';
import { weightsSince } from '@/db/weightRepo';

export interface ProgressData {
  loading: boolean;
  weights: WeightLog[]; // últimos 90 dias, asc
  water7: { dayKey: string; totalMl: number }[];
  kcal7: { dayKey: string; kcal: number }[];
  doses: DoseLog[];
  metrics: MetricRow[]; // último valor de cada métrica com dados
  refresh: () => Promise<void>;
}

export function useProgressData(): ProgressData {
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [water7, setWater7] = useState<{ dayKey: string; totalMl: number }[]>([]);
  const [kcal7, setKcal7] = useState<{ dayKey: string; kcal: number }[]>([]);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);

  const refresh = useCallback(async () => {
    const now = new Date();
    const since90 = new Date(now);
    since90.setDate(since90.getDate() - 90);
    const [w, wa, kc, ds, met] = await Promise.all([
      weightsSince(db, since90),
      waterDailyTotals(db, 7, now),
      kcalDailyTotals(db, 7, now),
      listDoses(db, 20),
      latestMetrics(db),
    ]);
    setWeights(w);
    setWater7(wa);
    setKcal7(kc);
    setDoses(ds);
    setMetrics([...met.values()]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { loading, weights, water7, kcal7, doses, metrics, refresh };
}
