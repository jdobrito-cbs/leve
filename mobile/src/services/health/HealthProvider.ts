export interface WeightSample {
  kg: number;
  takenAt: Date;
  source: string;
}

export interface StepsSample {
  count: number;
  date: string;
}

export interface HealthProvider {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  readWeight(since: Date): Promise<WeightSample[]>;
  readSteps(since: Date): Promise<StepsSample[]>;
}

/** Padrão até a Fase 2 (HealthKit no iOS, Health Connect no Android). */
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
