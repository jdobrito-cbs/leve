import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
import type { MetricSample, MetricType } from '@/core/metrics';
import type { HealthProvider, StepsSample, WeightSample } from './HealthProvider';

interface QuantitySample {
  quantity?: number | null;
  startDate?: string | Date;
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
}

function rowsOf(result: QuantitySample[] | { samples?: QuantitySample[] }): QuantitySample[] {
  return Array.isArray(result) ? result : (result?.samples ?? []);
}

const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass';
const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount';

/** Identificadores HealthKit → métrica do Leve (iOS não testável neste ambiente; adapter defensivo). */
const HK_METRICS: Array<{ id: string; type: MetricType }> = [
  { id: 'HKQuantityTypeIdentifierBodyFatPercentage', type: 'body_fat_pct' },
  { id: 'HKQuantityTypeIdentifierLeanBodyMass', type: 'lean_mass_kg' },
  { id: 'HKQuantityTypeIdentifierRestingHeartRate', type: 'heart_rate_resting' },
  { id: 'HKQuantityTypeIdentifierHeartRate', type: 'heart_rate_avg' },
  { id: 'HKQuantityTypeIdentifierOxygenSaturation', type: 'spo2' },
  { id: 'HKQuantityTypeIdentifierRespiratoryRate', type: 'respiratory_rate' },
  { id: 'HKQuantityTypeIdentifierActiveEnergyBurned', type: 'active_calories' },
  { id: 'HKQuantityTypeIdentifierAppleExerciseTime', type: 'exercise_minutes' },
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
        toRead: [BODY_MASS, STEP_COUNT, ...HK_METRICS.map((m) => m.id)],
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
    for (const { id, type } of HK_METRICS) {
      try {
        const rows = rowsOf(
          await this.mod.queryQuantitySamples(id, {
            filter: { date: { startDate: since, endDate: new Date() } },
            limit: 0,
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
    return samples;
  }
}
