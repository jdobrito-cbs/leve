import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
import type { MetricSample, MetricType } from '@/core/metrics';
import type { HealthProvider, StepsSample, WeightSample } from './HealthProvider';

interface QuantitySample {
  quantity?: number | null;
  startDate?: string | Date;
}

interface CategorySample {
  value?: number | null;
  startDate?: string | Date;
  endDate?: string | Date;
}

/**
 * Superfície mínima usada do @kingstinct/react-native-healthkit.
 * ATENÇÃO: iOS não é testável neste ambiente (sem Mac); o adapter é defensivo —
 * qualquer divergência de API resulta em listas vazias, nunca em crash.
 */
/** Opções da v14: `limit` é OBRIGATÓRIO (0 = todos) e o período vai em filter.date. */
interface HKQueryOptions {
  filter?: { date?: { startDate?: Date; endDate?: Date } };
  limit: number;
  unit?: string;
  ascending?: boolean;
}

interface HealthKitModule {
  isHealthDataAvailable(): Promise<boolean>;
  /** v14: opções em objeto — { toRead, toShare }. */
  requestAuthorization(options: { toRead: string[]; toShare: string[] }): Promise<boolean>;
  queryQuantitySamples(
    identifier: string,
    options: HKQueryOptions,
  ): Promise<QuantitySample[] | { samples?: QuantitySample[] }>;
  queryCategorySamples?(
    identifier: string,
    options: HKQueryOptions,
  ): Promise<CategorySample[] | { samples?: CategorySample[] }>;
}

function rowsOf(result: QuantitySample[] | { samples?: QuantitySample[] }): QuantitySample[] {
  return Array.isArray(result) ? result : (result?.samples ?? []);
}

const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass';
const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount';
const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis';

/** Identificadores HealthKit → métrica do Leve (iOS não testável neste ambiente; adapter defensivo). */
const HK_METRICS: Array<{ id: string; type: MetricType; unit?: string }> = [
  { id: 'HKQuantityTypeIdentifierWaistCircumference', type: 'waist_cm', unit: 'cm' },
  { id: 'HKQuantityTypeIdentifierBodyFatPercentage', type: 'body_fat_pct' },
  { id: 'HKQuantityTypeIdentifierLeanBodyMass', type: 'lean_mass_kg' },
  { id: 'HKQuantityTypeIdentifierRestingHeartRate', type: 'heart_rate_resting' },
  { id: 'HKQuantityTypeIdentifierHeartRate', type: 'heart_rate_avg' },
  { id: 'HKQuantityTypeIdentifierOxygenSaturation', type: 'spo2' },
  { id: 'HKQuantityTypeIdentifierRespiratoryRate', type: 'respiratory_rate' },
  { id: 'HKQuantityTypeIdentifierActiveEnergyBurned', type: 'active_calories' },
  { id: 'HKQuantityTypeIdentifierAppleExerciseTime', type: 'exercise_minutes' },
  // Apneia: distúrbios respiratórios por hora de sono (Apple Watch, iOS 18+).
  { id: 'HKQuantityTypeIdentifierAppleSleepingBreathingDisturbances', type: 'breathing_disturbances' },
];

function getModule(): HealthKitModule | null {
  try {
    return require('@kingstinct/react-native-healthkit') as HealthKitModule;
  } catch {
    return null;
  }
}

/** Adapter fino sobre o HealthKit (iOS). Nunca lança: falhas viram resultados vazios. */
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
        toRead: [BODY_MASS, STEP_COUNT, SLEEP, ...HK_METRICS.map((m) => m.id)],
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
            // Percentuais podem vir como fração (0,314) — normaliza para 31,4%.
            const isPct = type === 'body_fat_pct' || type === 'spo2';
            const value = isPct && s.quantity <= 1 ? s.quantity * 100 : s.quantity;
            samples.push({ type, value, takenAt: new Date(s.startDate) });
          }
        }
      } catch {
        // tipo indisponível neste aparelho — segue para o próximo
      }
    }
    samples.push(...(await this.readSleep(since)));
    return samples;
  }

  /** Sono por noite a partir dos trechos do HealthKit: horas dormidas e
   *  eficiência (% do tempo na cama efetivamente dormindo). */
  private async readSleep(since: Date): Promise<MetricSample[]> {
    if (!this.mod?.queryCategorySamples) return [];
    try {
      const rows = rowsOf(
        (await this.mod.queryCategorySamples(SLEEP, {
          filter: { date: { startDate: since, endDate: new Date() } },
          limit: 0,
        })) as CategorySample[] | { samples?: CategorySample[] },
      ) as CategorySample[];
      // Valores HKCategoryValueSleepAnalysis: 0 na cama, 2 acordado, 1/3/4/5 dormindo.
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
        // Sem trechos de "na cama"/"acordado" não há como medir eficiência.
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
}
