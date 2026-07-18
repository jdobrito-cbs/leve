import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import type { DoseLog, SymptomLog, WeightLog } from '@/core/types';
import { db } from '@/db/client';
import { latestDose, listDoses } from '@/db/doseRepo';
import { gymKcalForDay } from '@/db/gymRepo';
import { DayMacros, macrosForDay } from '@/db/foodLogRepo';
import { latestMetric, metricSeries } from '@/db/metricsRepo';
import { getProfile } from '@/db/profileRepo';
import { getSetting } from '@/db/settingsRepo';
import { listSymptoms, symptomsForDay } from '@/db/symptomRepo';
import { latestWaterAt, waterTotalForDay } from '@/db/waterRepo';
import { firstWeight, listWeights } from '@/db/weightRepo';
import { todayIntakes, type TodayIntake } from '@/features/meds/medsRepo';
import { buildInsightInput } from '@/features/insights/data';
import { buildInsights, type Insight } from '@/features/insights/insights';
import { getEffectiveWaterGoal } from '@/features/water/waterGoal';
import { getCloudAccount } from '@/services/cloudAccount';
import { getHealthProvider } from '@/services/health/HealthProvider';
import { autoSyncIfDue, readTodaySteps } from '@/services/health/healthSync';

export interface HealthLatest {
  sleepHours: number | null;
  restingHr: number | null;
  spo2: number | null;
  respiratoryRate: number | null;
}

export interface TodaySummary {
  loading: boolean;
  /** Nome para a saudação: perfil, senão o da conta conectada. */
  userName: string | null;
  waterMl: number;
  waterGoalMl: number;
  /** Horário (ISO) do último registro de água de hoje, ou null. */
  lastWaterAt: string | null;
  macros: DayMacros;
  kcal: number;
  calorieGoalKcal: number | null;
  lastWeightKg: number | null;
  /** Primeiro peso registrado + os 5 últimos, em ordem cronológica. */
  weightSeries: WeightLog[];
  goalWeightKg: number | null;
  nextDoseAt: string | null;
  lastDoseLabel: string | null;
  doseIntervalDays: number | null;
  doses: DoseLog[];
  symptomsCount: number;
  /** Os 7 últimos sintomas registrados (mais recentes primeiro). */
  recentSymptoms: SymptomLog[];
  steps: number | null;
  activeCalories: number;
  healthLatest: HealthLatest;
  intakes: TodayIntake[];
  medsToday: { taken: number; total: number } | null;
  insights: Insight[];
  refresh: () => Promise<void>;
}

const EMPTY_MACROS: DayMacros = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
const EMPTY_HEALTH: HealthLatest = {
  sleepHours: null,
  restingHr: null,
  spo2: null,
  respiratoryRate: null,
};

export function useTodaySummary(): TodaySummary {
  const [loading, setLoading] = useState(true);
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoalMl, setWaterGoalMl] = useState(2000);
  const [lastWaterAt, setLastWaterAt] = useState<string | null>(null);
  const [macros, setMacros] = useState<DayMacros>(EMPTY_MACROS);
  const [calorieGoalKcal, setCalorieGoalKcal] = useState<number | null>(null);
  const [lastWeightKg, setLastWeightKg] = useState<number | null>(null);
  const [weightSeries, setWeightSeries] = useState<WeightLog[]>([]);
  const [goalWeightKg, setGoalWeightKg] = useState<number | null>(null);
  const [nextDoseAt, setNextDoseAt] = useState<string | null>(null);
  const [lastDoseLabel, setLastDoseLabel] = useState<string | null>(null);
  const [doseIntervalDays, setDoseIntervalDays] = useState<number | null>(null);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [symptomsCount, setSymptomsCount] = useState(0);
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomLog[]>([]);
  const [steps, setSteps] = useState<number | null>(null);
  const [activeCalories, setActiveCalories] = useState(0);
  const [healthLatest, setHealthLatest] = useState<HealthLatest>(EMPTY_HEALTH);
  const [intakes, setIntakes] = useState<TodayIntake[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // Balança/wearable → app de saúde → Leve, sem toque (throttle de 1 h).
    await autoSyncIfDue(db).catch(() => undefined);
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const [water, dayMacros, first, recentWeights, dose, doseList, symptoms, profile, waterGoal] =
      await Promise.all([
        waterTotalForDay(db, now),
        macrosForDay(db, now),
        firstWeight(db),
        listWeights(db, 5),
        latestDose(db),
        listDoses(db, 30),
        symptomsForDay(db, now),
        getProfile(db),
        getEffectiveWaterGoal(db),
      ]);
    setRecentSymptoms(await listSymptoms(db, 7));
    setWaterMl(water);
    try {
      setLastWaterAt(await latestWaterAt(db, now));
    } catch {
      setLastWaterAt(null);
    }
    setMacros(dayMacros);
    setLastWeightKg(recentWeights[0]?.weightKg ?? null);
    // Gráfico: do primeiro peso registrado aos 5 últimos.
    const recentAsc = [...recentWeights].reverse();
    setWeightSeries(
      first && !recentAsc.some((w) => w.id === first.id) ? [first, ...recentAsc] : recentAsc,
    );
    setNextDoseAt(dose?.nextDoseAt ?? null);
    setLastDoseLabel(dose ? `${dose.medication} · ${dose.doseMg} mg` : null);
    setDoses(doseList);
    setSymptomsCount(symptoms.length);
    setWaterGoalMl(waterGoal.goalMl);
    if (profile) {
      setCalorieGoalKcal(profile.calorieGoalKcal ?? null);
      setGoalWeightKg(profile.goalWeightKg ?? null);
    }
    // Saudação usa só o primeiro nome (nomes extensos poluem o topo).
    const firstName = (full: string | null | undefined) =>
      full?.trim().split(/\s+/)[0] ?? null;
    try {
      const account = profile?.name ? null : await getCloudAccount(db);
      setUserName(firstName(profile?.name ?? account?.name));
    } catch {
      setUserName(firstName(profile?.name));
    }
    try {
      setDoseIntervalDays(await getSetting<number>(db, 'doseIntervalDays'));
    } catch {
      setDoseIntervalDays(null);
    }
    try {
      const health = await getSetting<{ connected?: boolean }>(db, 'health');
      setSteps(health?.connected ? await readTodaySteps(getHealthProvider()) : null);
    } catch {
      setSteps(null);
    }
    try {
      const burned = await metricSeries(db, 'active_calories', startOfDay);
      // Saúde conectada + exercícios registrados na Academia.
      const gymKcal = await gymKcalForDay(db, now).catch(() => 0);
      setActiveCalories(Math.round(burned.reduce((a, m) => a + m.value, 0) + gymKcal));
      const [sleep, hr, spo2, resp] = await Promise.all([
        latestMetric(db, 'sleep_hours'),
        latestMetric(db, 'heart_rate_resting'),
        latestMetric(db, 'spo2'),
        latestMetric(db, 'respiratory_rate'),
      ]);
      setHealthLatest({
        sleepHours: sleep?.value ?? null,
        restingHr: hr?.value ?? null,
        spo2: spo2?.value ?? null,
        respiratoryRate: resp?.value ?? null,
      });
    } catch {
      setActiveCalories(0);
      setHealthLatest(EMPTY_HEALTH);
    }
    try {
      setInsights(buildInsights(await buildInsightInput(db)));
    } catch {
      setInsights([]);
    }
    try {
      setIntakes(await todayIntakes(db, now));
    } catch {
      setIntakes([]);
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
    userName,
    waterMl,
    waterGoalMl,
    lastWaterAt,
    macros,
    kcal: macros.kcal,
    calorieGoalKcal,
    lastWeightKg,
    weightSeries,
    goalWeightKg,
    nextDoseAt,
    lastDoseLabel,
    doseIntervalDays,
    doses,
    symptomsCount,
    recentSymptoms,
    steps,
    activeCalories,
    healthLatest,
    intakes,
    medsToday:
      intakes.length > 0
        ? { taken: intakes.filter((i) => i.takenAt).length, total: intakes.length }
        : null,
    insights,
    refresh,
  };
}
