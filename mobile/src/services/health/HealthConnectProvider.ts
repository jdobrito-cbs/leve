import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
import type { HealthProvider, StepsSample, WeightSample } from './HealthProvider';

interface WeightRecord {
  weight?: { inKilograms?: number | null } | null;
  time?: string;
}

interface StepsRecord {
  count?: number | null;
  startTime?: string;
}

interface HealthConnectModule {
  initialize(): Promise<boolean>;
  requestPermission(
    permissions: Array<{ accessType: 'read'; recordType: 'Weight' | 'Steps' }>,
  ): Promise<unknown[]>;
  readRecords(
    recordType: 'Weight' | 'Steps',
    options: {
      timeRangeFilter: { operator: 'between'; startTime: string; endTime: string };
    },
  ): Promise<{ records: unknown[] }>;
}

function getModule(): HealthConnectModule | null {
  try {
    return require('react-native-health-connect') as HealthConnectModule;
  } catch {
    return null;
  }
}

/** Adapter fino sobre o Health Connect (Android). Nunca lança: falhas viram resultados vazios. */
export class HealthConnectProvider implements HealthProvider {
  private mod = getModule();

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android' || !this.mod) return false;
    try {
      return await this.mod.initialize();
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.mod) return false;
    try {
      await this.mod.initialize();
      const granted = await this.mod.requestPermission([
        { accessType: 'read', recordType: 'Weight' },
        { accessType: 'read', recordType: 'Steps' },
      ]);
      return granted.length > 0;
    } catch {
      return false;
    }
  }

  async readWeight(since: Date): Promise<WeightSample[]> {
    if (!this.mod) return [];
    try {
      const { records } = await this.mod.readRecords('Weight', {
        timeRangeFilter: {
          operator: 'between',
          startTime: since.toISOString(),
          endTime: new Date().toISOString(),
        },
      });
      return (records as WeightRecord[])
        .map((r) => ({
          kg: r.weight?.inKilograms ?? Number.NaN,
          takenAt: new Date(r.time ?? 0),
          source: 'healthconnect',
        }))
        .filter((s) => Number.isFinite(s.kg) && s.kg > 0);
    } catch {
      return [];
    }
  }

  async readSteps(since: Date): Promise<StepsSample[]> {
    if (!this.mod) return [];
    try {
      const { records } = await this.mod.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: since.toISOString(),
          endTime: new Date().toISOString(),
        },
      });
      const byDay = new Map<string, number>();
      for (const r of records as StepsRecord[]) {
        if (!r.startTime || !r.count) continue;
        const day = localDayKey(new Date(r.startTime));
        byDay.set(day, (byDay.get(day) ?? 0) + r.count);
      }
      return [...byDay.entries()].map(([date, count]) => ({ date, count }));
    } catch {
      return [];
    }
  }
}
