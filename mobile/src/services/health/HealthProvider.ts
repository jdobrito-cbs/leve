import type { MetricSample } from '@/core/metrics';
import { localDayKey } from '@/core/datetime';

export interface WeightSample {
  kg: number;
  takenAt: Date;
  source: string;
}

export interface StepsSample {
  count: number;
  date: string;
}

/** Uma noite de sono registrada: primeiro trecho (deitar) e último (acordar). */
export interface SleepNight {
  start: Date;
  end: Date;
}

/** Agrega trechos de sono em noites (chave = dia em que a noite terminou);
 *  sonecas com menos de 3h no total ficam de fora. Compartilhado iOS/Android. */
export function aggregateSleepNights(spans: SleepNight[]): SleepNight[] {
  const nights = new Map<string, { start: Date; end: Date; totalMs: number }>();
  for (const { start, end } of spans) {
    const ms = end.getTime() - start.getTime();
    if (!(ms > 0)) continue;
    const key = localDayKey(end);
    const night = nights.get(key) ?? { start, end, totalMs: 0 };
    if (start < night.start) night.start = start;
    if (end > night.end) night.end = end;
    night.totalMs += ms;
    nights.set(key, night);
  }
  return [...nights.values()]
    .filter((n) => n.totalMs >= 3 * 36e5)
    .map(({ start, end }) => ({ start, end }));
}

export interface HealthProvider {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  readWeight(since: Date): Promise<WeightSample[]>;
  readSteps(since: Date): Promise<StepsSample[]>;
  readMetrics(since: Date): Promise<MetricSample[]>;
  readSleepNights(since: Date): Promise<SleepNight[]>;
  /** Soma de passos na janela; null quando a fonte está indisponível (≠ 0 passos). */
  readStepsWindow(start: Date, end: Date): Promise<number | null>;
}

/** Usado quando não há integração de saúde disponível no aparelho. */
export class UnavailableHealthProvider implements HealthProvider {
  async isAvailable() {
    return false;
  }
  async requestPermissions() {
    return false;
  }
  async readWeight(): Promise<WeightSample[]> {
    return [];
  }
  async readSteps(): Promise<StepsSample[]> {
    return [];
  }
  async readMetrics(): Promise<MetricSample[]> {
    return [];
  }
  async readSleepNights(): Promise<SleepNight[]> {
    return [];
  }
  async readStepsWindow(): Promise<number | null> {
    return null;
  }
}

export function getHealthProvider(): HealthProvider {
  try {
    const { Platform } = require('react-native') as typeof import('react-native');
    if (Platform.OS === 'android') {
      const { HealthConnectProvider } =
        require('./HealthConnectProvider') as typeof import('./HealthConnectProvider');
      return new HealthConnectProvider();
    }
    if (Platform.OS === 'ios') {
      const { HealthKitProvider } =
        require('./HealthKitProvider') as typeof import('./HealthKitProvider');
      return new HealthKitProvider();
    }
  } catch {
    // módulo nativo ausente (ex.: Expo Go) — cai no provider indisponível
  }
  return new UnavailableHealthProvider();
}
