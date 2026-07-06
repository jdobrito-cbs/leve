import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import type { WeightLog } from '@/core/types';
import { db } from '@/db/client';
import { latestDose } from '@/db/doseRepo';
import { kcalForDay } from '@/db/foodLogRepo';
import { getProfile } from '@/db/profileRepo';
import { symptomsForDay } from '@/db/symptomRepo';
import { getSetting } from '@/db/settingsRepo';
import { waterTotalForDay } from '@/db/waterRepo';
import { latestWeight, weightsSince } from '@/db/weightRepo';
import { getHealthProvider } from '@/services/health/HealthProvider';
import { readTodaySteps } from '@/services/health/healthSync';

export interface TodaySummary {
  loading: boolean;
  waterMl: number;
  waterGoalMl: number;
  kcal: number;
  calorieGoalKcal: number | null;
  lastWeightKg: number | null;
  weights30: WeightLog[];
  goalWeightKg: number | null;
  nextDoseAt: string | null;
  lastDoseLabel: string | null;
  symptomsCount: number;
  steps: number | null;
  refresh: () => Promise<void>;
}

export function useTodaySummary(): TodaySummary {
  const [loading, setLoading] = useState(true);
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoalMl, setWaterGoalMl] = useState(2000);
  const [kcal, setKcal] = useState(0);
  const [calorieGoalKcal, setCalorieGoalKcal] = useState<number | null>(null);
  const [lastWeightKg, setLastWeightKg] = useState<number | null>(null);
  const [weights30, setWeights30] = useState<WeightLog[]>([]);
  const [goalWeightKg, setGoalWeightKg] = useState<number | null>(null);
  const [nextDoseAt, setNextDoseAt] = useState<string | null>(null);
  const [lastDoseLabel, setLastDoseLabel] = useState<string | null>(null);
  const [symptomsCount, setSymptomsCount] = useState(0);
  const [steps, setSteps] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const now = new Date();
    const since30 = new Date(now);
    since30.setDate(since30.getDate() - 30);
    const [water, kcalToday, weight, weightSeries, dose, symptoms, profile] = await Promise.all([
      waterTotalForDay(db, now),
      kcalForDay(db, now),
      latestWeight(db),
      weightsSince(db, since30),
      latestDose(db),
      symptomsForDay(db, now),
      getProfile(db),
    ]);
    setWaterMl(water);
    setKcal(kcalToday);
    setLastWeightKg(weight?.weightKg ?? null);
    setWeights30(weightSeries);
    setNextDoseAt(dose?.nextDoseAt ?? null);
    setLastDoseLabel(dose ? `${dose.medication} · ${dose.doseMg} mg` : null);
    setSymptomsCount(symptoms.length);
    if (profile) {
      setWaterGoalMl(profile.waterGoalMl ?? 2000);
      setCalorieGoalKcal(profile.calorieGoalKcal ?? null);
      setGoalWeightKg(profile.goalWeightKg ?? null);
    }
    try {
      const health = await getSetting<{ connected?: boolean }>(db, 'health');
      setSteps(health?.connected ? await readTodaySteps(getHealthProvider()) : null);
    } catch {
      setSteps(null);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {
    loading,
    waterMl,
    waterGoalMl,
    kcal,
    calorieGoalKcal,
    lastWeightKg,
    weights30,
    goalWeightKg,
    nextDoseAt,
    lastDoseLabel,
    symptomsCount,
    steps,
    refresh,
  };
}
