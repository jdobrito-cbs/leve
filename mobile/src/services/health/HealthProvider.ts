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

import type { MetricSample } from '@/core/metrics';

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
