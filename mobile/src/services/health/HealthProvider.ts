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
  return new UnavailableHealthProvider();
}
