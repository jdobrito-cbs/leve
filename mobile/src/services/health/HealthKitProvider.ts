import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
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
interface HealthKitModule {
  isHealthDataAvailable(): Promise<boolean>;
  requestAuthorization(
    shareIdentifiers: string[],
    readIdentifiers: string[],
  ): Promise<boolean>;
  queryQuantitySamples(
    identifier: string,
    options?: { filter?: { startDate?: Date; endDate?: Date }; limit?: number },
  ): Promise<QuantitySample[]>;
}

const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass';
const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount';

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
      return await this.mod.requestAuthorization([], [BODY_MASS, STEP_COUNT]);
    } catch {
      return false;
    }
  }

  async readWeight(since: Date): Promise<WeightSample[]> {
    if (!this.mod) return [];
    try {
      const samples = await this.mod.queryQuantitySamples(BODY_MASS, {
        filter: { startDate: since, endDate: new Date() },
      });
      return samples
        .map((s) => ({
          kg: s.quantity ?? Number.NaN,
          takenAt: new Date(s.startDate ?? 0),
          source: 'healthkit',
        }))
        .filter((s) => Number.isFinite(s.kg) && s.kg > 0);
    } catch {
      return [];
    }
  }

  async readSteps(since: Date): Promise<StepsSample[]> {
    if (!this.mod) return [];
    try {
      const samples = await this.mod.queryQuantitySamples(STEP_COUNT, {
        filter: { startDate: since, endDate: new Date() },
      });
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
}
