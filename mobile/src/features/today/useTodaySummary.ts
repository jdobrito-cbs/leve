import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { db } from '@/db/client';
import { latestDose } from '@/db/doseRepo';
import { kcalForDay } from '@/db/foodLogRepo';
import { getProfile } from '@/db/profileRepo';
import { symptomsForDay } from '@/db/symptomRepo';
import { waterTotalForDay } from '@/db/waterRepo';
import { latestWeight } from '@/db/weightRepo';

export interface TodaySummary {
  loading: boolean;
  waterMl: number;
  waterGoalMl: number;
  kcal: number;
  calorieGoalKcal: number | null;
  lastWeightKg: number | null;
  nextDoseAt: string | null;
  lastDoseLabel: string | null;
  symptomsCount: number;
  refresh: () => Promise<void>;
}

export function useTodaySummary(): TodaySummary {
  const [loading, setLoading] = useState(true);
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoalMl, setWaterGoalMl] = useState(2000);
  const [kcal, setKcal] = useState(0);
  const [calorieGoalKcal, setCalorieGoalKcal] = useState<number | null>(null);
  const [lastWeightKg, setLastWeightKg] = useState<number | null>(null);
  const [nextDoseAt, setNextDoseAt] = useState<string | null>(null);
  const [lastDoseLabel, setLastDoseLabel] = useState<string | null>(null);
  const [symptomsCount, setSymptomsCount] = useState(0);

  const refresh = useCallback(async () => {
    const now = new Date();
    const [water, kcalToday, weight, dose, symptoms, profile] = await Promise.all([
      waterTotalForDay(db, now),
      kcalForDay(db, now),
      latestWeight(db),
      latestDose(db),
      symptomsForDay(db, now),
      getProfile(db),
    ]);
    setWaterMl(water);
    setKcal(kcalToday);
    setLastWeightKg(weight?.weightKg ?? null);
    setNextDoseAt(dose?.nextDoseAt ?? null);
    setLastDoseLabel(dose ? `${dose.medication} · ${dose.doseMg} mg` : null);
    setSymptomsCount(symptoms.length);
    if (profile) {
      setWaterGoalMl(profile.waterGoalMl ?? 2000);
      setCalorieGoalKcal(profile.calorieGoalKcal ?? null);
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
    nextDoseAt,
    lastDoseLabel,
    symptomsCount,
    refresh,
  };
}
