import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
import type { MetricSample, MetricType } from '@/core/metrics';
import { aggregateSleepNights, type HealthProvider, type SleepNight, type StepsSample, type WeightSample, type WorkoutSample } from './HealthProvider';

interface WorkoutRouteLoc {
  latitude?: number | null;
  longitude?: number | null;
  date?: string | number | Date | null;
}

interface WorkoutRow {
  uuid?: string;
  workoutActivityType?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  duration?: number;
  totalDistance?: { quantity?: number } | number | null;
  totalEnergyBurned?: { quantity?: number } | number | null;
  getWorkoutRoutes?(): Promise<readonly { locations?: readonly WorkoutRouteLoc[] }[] | undefined>;
}

interface QuantitySample {
  quantity?: number | null;
  startDate?: string | Date;
}

interface CategorySample {
  value?: number | null;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface HKQueryOptions {
  filter?: { date?: { startDate?: Date; endDate?: Date } };
  limit: number;
  unit?: string;
  ascending?: boolean;
}

interface HealthKitModule {
  isHealthDataAvailable(): Promise<boolean>;
  requestAuthorization(options: { toRead: string[]; toShare: string[] }): Promise<boolean>;
  queryQuantitySamples(
    identifier: string,
    options: HKQueryOptions,
  ): Promise<QuantitySample[] | { samples?: QuantitySample[] }>;
  queryCategorySamples?(
    identifier: string,
    options: HKQueryOptions,
  ): Promise<CategorySample[] | { samples?: CategorySample[] }>;
  queryWorkoutSamples?(options: {
    filter?: { date?: { startDate?: Date; endDate?: Date } };
    limit: number;
    distanceUnit?: string;
    energyUnit?: string;
  }): Promise<WorkoutRow[] | { samples?: WorkoutRow[] }>;
}

function rowsOf(result: QuantitySample[] | { samples?: QuantitySample[] }): QuantitySample[] {
  return Array.isArray(result) ? result : (result?.samples ?? []);
}

const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass';
const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount';
const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis';
const WORKOUT_TYPE = 'HKWorkoutTypeIdentifier';

const HK_METRICS: { id: string; type: MetricType; unit?: string }[] = [
  { id: 'HKQuantityTypeIdentifierWaistCircumference', type: 'waist_cm', unit: 'cm' },
  { id: 'HKQuantityTypeIdentifierBodyFatPercentage', type: 'body_fat_pct' },
  { id: 'HKQuantityTypeIdentifierLeanBodyMass', type: 'lean_mass_kg' },
  { id: 'HKQuantityTypeIdentifierRestingHeartRate', type: 'heart_rate_resting' },
  { id: 'HKQuantityTypeIdentifierHeartRate', type: 'heart_rate_avg' },
  { id: 'HKQuantityTypeIdentifierOxygenSaturation', type: 'spo2' },
  { id: 'HKQuantityTypeIdentifierRespiratoryRate', type: 'respiratory_rate' },
  { id: 'HKQuantityTypeIdentifierActiveEnergyBurned', type: 'active_calories' },
  { id: 'HKQuantityTypeIdentifierAppleExerciseTime', type: 'exercise_minutes' },
  { id: 'HKQuantityTypeIdentifierAppleSleepingBreathingDisturbances', type: 'breathing_disturbances' },
];

function getModule(): HealthKitModule | null {
  try {
    return require('@kingstinct/react-native-healthkit') as HealthKitModule;
  } catch {
    return null;
  }
}

export class HealthKitProvider implements HealthProvider {
  private mod = getModule();

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !this.mod) return false;
    try {
      return await this.mod.isHealthDataAvailable();
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.mod) return false;
    try {
      return await this.mod.requestAuthorization({
        toRead: [BODY_MASS, STEP_COUNT, SLEEP, WORKOUT_TYPE, ...HK_METRICS.map((m) => m.id)],
        toShare: [],
      });
    } catch (e) {
      console.warn('[leve] HealthKit requestAuthorization falhou:', e);
      return false;
    }
  }

  async readWeight(since: Date): Promise<WeightSample[]> {
    if (!this.mod) return [];
    try {
      const samples = rowsOf(
        await this.mod.queryQuantitySamples(BODY_MASS, {
          filter: { date: { startDate: since, endDate: new Date() } },
          limit: 0,
          unit: 'kg',
        }),
      );
      return samples
        .map((s) => ({
          kg: s.quantity ?? Number.NaN,
          takenAt: new Date(s.startDate ?? 0),
          source: 'healthkit',
        }))
        .filter((s) => Number.isFinite(s.kg) && s.kg > 0);
    } catch (e) {
      console.warn('[leve] HealthKit leitura de peso falhou:', e);
      return [];
    }
  }

  async readSteps(since: Date): Promise<StepsSample[]> {
    if (!this.mod) return [];
    try {
      const samples = rowsOf(
        await this.mod.queryQuantitySamples(STEP_COUNT, {
          filter: { date: { startDate: since, endDate: new Date() } },
          limit: 0,
        }),
      );
      const byDay = new Map<string, number>();
      for (const s of samples) {
        if (!s.startDate || !s.quantity) continue;
        const day = localDayKey(new Date(s.startDate));
        byDay.set(day, (byDay.get(day) ?? 0) + s.quantity);
      }
      return [...byDay.entries()].map(([date, count]) => ({ date, count }));
    } catch {
      return [];
    }
  }

  async readStepsWindow(start: Date, end: Date): Promise<number | null> {
    if (!this.mod) return null;
    try {
      const samples = rowsOf(
        await this.mod.queryQuantitySamples(STEP_COUNT, {
          filter: { date: { startDate: start, endDate: end } },
          limit: 0,
        }),
      );
      return samples.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
    } catch {
      return null;
    }
  }

  async readHeartRateWindow(start: Date, end: Date): Promise<number | null> {
    if (!this.mod) return null;
    try {
      const samples = rowsOf(
        await this.mod.queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', {
          filter: { date: { startDate: start, endDate: end } },
          limit: 0,
        }),
      );
      const vals = samples
        .map((s) => s.quantity ?? Number.NaN)
        .filter((v) => Number.isFinite(v) && v > 0);
      if (vals.length === 0) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    } catch {
      return null;
    }
  }

  async readWorkouts(since: Date): Promise<WorkoutSample[]> {
    if (!this.mod?.queryWorkoutSamples) return [];
    try {
      const res = await this.mod.queryWorkoutSamples({
        filter: { date: { startDate: since, endDate: new Date() } },
        limit: 200,
        distanceUnit: 'm',
        energyUnit: 'kcal',
      });
      const rows = Array.isArray(res) ? res : (res?.samples ?? []);
      const num = (v: unknown): number | null =>
        typeof v === 'number' && Number.isFinite(v) ? v : null;
      const qty = (v: unknown): number | null =>
        typeof v === 'number' ? num(v) : num((v as { quantity?: unknown } | undefined)?.quantity);
      const typeOf = (n: unknown): 'run' | 'walk' | 'other' =>
        n === 37 ? 'run' : n === 52 ? 'walk' : 'other';
      const out: WorkoutSample[] = [];
      for (const w of rows) {
        const start = w.startDate ? new Date(w.startDate) : null;
        if (!start || !Number.isFinite(start.getTime())) continue;
        const end = w.endDate ? new Date(w.endDate) : null;
        const type = typeOf(w.workoutActivityType);
        const dist = qty(w.totalDistance);
        const cal = qty(w.totalEnergyBurned);
        const dur = num(w.duration);
        const route =
          (type === 'run' || type === 'walk') && dist != null && dist > 0
            ? await this.readRoute(w, start.getTime())
            : null;
        out.push({
          externalId: w.uuid ?? null,
          type,
          startAt: start.toISOString(),
          endAt: end ? end.toISOString() : null,
          durationSec:
            dur != null
              ? Math.round(dur)
              : end
                ? Math.round((end.getTime() - start.getTime()) / 1000)
                : null,
          distanceM: dist != null && dist > 0 ? Math.round(dist) : null,
          calories: cal != null && cal > 0 ? Math.round(cal) : null,
          route,
        });
      }
      return out;
    } catch (e) {
      console.warn('[leve] HealthKit leitura de treinos falhou:', e);
      return [];
    }
  }

  private async readRoute(
    w: WorkoutRow,
    startMs: number,
  ): Promise<{ lat: number; lng: number; t?: number }[] | null> {
    if (typeof w.getWorkoutRoutes !== 'function') return null;
    try {
      const routes = (await w.getWorkoutRoutes()) ?? [];
      const pts: { lat: number; lng: number; t?: number }[] = [];
      for (const r of routes) {
        for (const loc of r?.locations ?? []) {
          const lat = typeof loc.latitude === 'number' ? loc.latitude : Number.NaN;
          const lng = typeof loc.longitude === 'number' ? loc.longitude : Number.NaN;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          const at = loc.date != null ? new Date(loc.date).getTime() : Number.NaN;
          if (Number.isFinite(at)) pts.push({ lat, lng, t: Math.max(0, at - startMs) });
          else pts.push({ lat, lng });
        }
      }
      pts.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
      return pts.length > 0 ? pts : null;
    } catch {
      return null;
    }
  }

  async readMetrics(since: Date): Promise<MetricSample[]> {
    if (!this.mod) return [];
    const samples: MetricSample[] = [];
    for (const { id, type, unit } of HK_METRICS) {
      try {
        const rows = rowsOf(
          await this.mod.queryQuantitySamples(id, {
            filter: { date: { startDate: since, endDate: new Date() } },
            limit: 0,
            ...(unit ? { unit } : {}),
          }),
        );
        for (const s of rows) {
          if (typeof s.quantity === 'number' && Number.isFinite(s.quantity) && s.startDate) {
            const isPct = type === 'body_fat_pct' || type === 'spo2';
            const value = isPct && s.quantity <= 1 ? s.quantity * 100 : s.quantity;
            samples.push({ type, value, takenAt: new Date(s.startDate) });
          }
        }
      } catch {
      }
    }
    samples.push(...(await this.readSleep(since)));
    return samples;
  }

  private async readSleep(since: Date): Promise<MetricSample[]> {
    if (!this.mod?.queryCategorySamples) return [];
    try {
      const rows = rowsOf(
        (await this.mod.queryCategorySamples(SLEEP, {
          filter: { date: { startDate: since, endDate: new Date() } },
          limit: 0,
        })) as CategorySample[] | { samples?: CategorySample[] },
      ) as CategorySample[];
      const nights = new Map<
        string,
        { asleepMs: number; inBedMs: number; awakeMs: number; end: Date }
      >();
      for (const s of rows) {
        if (!s.startDate || !s.endDate || typeof s.value !== 'number') continue;
        const start = new Date(s.startDate);
        const end = new Date(s.endDate);
        const ms = end.getTime() - start.getTime();
        if (!(ms > 0)) continue;
        const key = localDayKey(end);
        const night = nights.get(key) ?? { asleepMs: 0, inBedMs: 0, awakeMs: 0, end };
        if (s.value === 0) night.inBedMs += ms;
        else if (s.value === 2) night.awakeMs += ms;
        else night.asleepMs += ms;
        if (end > night.end) night.end = end;
        nights.set(key, night);
      }
      const out: MetricSample[] = [];
      for (const night of nights.values()) {
        if (night.asleepMs <= 0) continue;
        out.push({
          type: 'sleep_hours',
          value: Math.round((night.asleepMs / 36e5) * 10) / 10,
          takenAt: night.end,
        });
        if (night.inBedMs + night.awakeMs > 0) {
          const denom = Math.max(night.inBedMs, night.asleepMs + night.awakeMs);
          out.push({
            type: 'sleep_efficiency_pct',
            value: Math.min(100, Math.round((night.asleepMs / denom) * 100)),
            takenAt: night.end,
          });
        }
      }
      return out;
    } catch (e) {
      console.warn('[leve] HealthKit leitura de sono falhou:', e);
      return [];
    }
  }

  async readSleepNights(since: Date): Promise<SleepNight[]> {
    if (!this.mod?.queryCategorySamples) return [];
    try {
      const rows = rowsOf(
        (await this.mod.queryCategorySamples(SLEEP, {
          filter: { date: { startDate: since, endDate: new Date() } },
          limit: 0,
        })) as CategorySample[] | { samples?: CategorySample[] },
      ) as CategorySample[];
      return aggregateSleepNights(
        rows
          .filter((s) => s.startDate && s.endDate)
          .map((s) => ({ start: new Date(s.startDate!), end: new Date(s.endDate!) })),
      );
    } catch {
      return [];
    }
  }
}
