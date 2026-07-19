import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
import type { MetricSample, MetricType } from '@/core/metrics';
import type { HealthProvider, SleepNight, StepsSample, WeightSample } from './HealthProvider';

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
    permissions: Array<{ accessType: 'read'; recordType: string }>,
  ): Promise<unknown[]>;
  readRecords(
    recordType: string,
    options: {
      timeRangeFilter: { operator: 'between'; startTime: string; endTime: string };
    },
  ): Promise<{ records: unknown[] }>;
}

const METRIC_RECORD_TYPES = [
  'SleepSession',
  'RestingHeartRate',
  'HeartRate',
  'OxygenSaturation',
  'RespiratoryRate',
  'BodyFat',
  'BodyWaterMass',
  'BoneMass',
  'LeanBodyMass',
  'ActiveCaloriesBurned',
  'ExerciseSession',
];

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
        ...METRIC_RECORD_TYPES.map((recordType) => ({ accessType: 'read' as const, recordType })),
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

  async readStepsWindow(start: Date, end: Date): Promise<number | null> {
    if (!this.mod) return null;
    try {
      const { records } = await this.mod.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
      return (records as StepsRecord[]).reduce((sum, r) => sum + (r.count ?? 0), 0);
    } catch {
      return null;
    }
  }

  /** Noites de sono (deitar → acordar); sonecas <3h ficam de fora, como no iPhone. */
  async readSleepNights(since: Date): Promise<SleepNight[]> {
    if (!this.mod) return [];
    try {
      const { records } = await this.mod.readRecords('SleepSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: since.toISOString(),
          endTime: new Date().toISOString(),
        },
      });
      const nights = new Map<string, { start: Date; end: Date; totalMs: number }>();
      for (const r of records as Array<{ startTime?: string; endTime?: string }>) {
        if (!r.startTime || !r.endTime) continue;
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);
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
    } catch {
      return [];
    }
  }

  async readMetrics(since: Date): Promise<MetricSample[]> {
    if (!this.mod) return [];
    const range = {
      timeRangeFilter: {
        operator: 'between' as const,
        startTime: since.toISOString(),
        endTime: new Date().toISOString(),
      },
    };
    const read = async (recordType: string): Promise<Record<string, unknown>[]> => {
      try {
        const { records } = await this.mod!.readRecords(recordType, range);
        return records as Record<string, unknown>[];
      } catch {
        return [];
      }
    };
    const num = (v: unknown): number | null =>
      typeof v === 'number' && Number.isFinite(v) ? v : null;
    const kg = (v: unknown): number | null =>
      num((v as { inKilograms?: unknown } | undefined)?.inKilograms);
    const when = (r: Record<string, unknown>): Date | null => {
      const t = (r.time ?? r.endTime ?? r.startTime) as string | undefined;
      return t ? new Date(t) : null;
    };

    const samples: MetricSample[] = [];
    const push = (type: MetricType, value: number | null, takenAt: Date | null) => {
      if (value !== null && takenAt) samples.push({ type, value, takenAt });
    };

    for (const r of await read('SleepSession')) {
      const start = r.startTime ? new Date(r.startTime as string) : null;
      const end = r.endTime ? new Date(r.endTime as string) : null;
      if (!start || !end || end <= start) continue;
      const sessionMs = end.getTime() - start.getTime();
      // Estágios (quando o relógio registra): 2/4/5/6 = dormindo, 1/7 = acordado.
      const stages =
        (r.stages as Array<{ startTime?: string; endTime?: string; stage?: number }> | undefined) ??
        [];
      let asleepMs = 0;
      let awakeMs = 0;
      for (const s of stages) {
        if (!s.startTime || !s.endTime) continue;
        const ms = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        if (!(ms > 0)) continue;
        if (s.stage === 2 || s.stage === 4 || s.stage === 5 || s.stage === 6) asleepMs += ms;
        else if (s.stage === 1 || s.stage === 7) awakeMs += ms;
      }
      const sleptMs = asleepMs > 0 ? asleepMs : sessionMs;
      push('sleep_hours', Math.round((sleptMs / 36e5) * 10) / 10, end);
      // Mesma régua do iPhone: % da noite efetivamente dormida.
      if (asleepMs > 0 && sessionMs > asleepMs) {
        push(
          'sleep_efficiency_pct',
          Math.min(100, Math.round((asleepMs / Math.max(sessionMs, asleepMs + awakeMs)) * 100)),
          end,
        );
      }
    }
    for (const r of await read('RestingHeartRate')) {
      push('heart_rate_resting', num(r.beatsPerMinute), when(r));
    }
    for (const r of await read('HeartRate')) {
      const s = (r.samples as Array<{ beatsPerMinute?: unknown }> | undefined) ?? [];
      const values = s.map((x) => num(x.beatsPerMinute)).filter((v): v is number => v !== null);
      if (values.length) {
        push(
          'heart_rate_avg',
          Math.round(values.reduce((a, b) => a + b, 0) / values.length),
          when(r),
        );
      }
    }
    for (const r of await read('OxygenSaturation')) push('spo2', num(r.percentage), when(r));
    for (const r of await read('RespiratoryRate')) push('respiratory_rate', num(r.rate), when(r));
    for (const r of await read('BodyFat')) push('body_fat_pct', num(r.percentage), when(r));
    for (const r of await read('BodyWaterMass')) push('body_water_kg', kg(r.mass), when(r));
    for (const r of await read('BoneMass')) push('bone_mass_kg', kg(r.mass), when(r));
    for (const r of await read('LeanBodyMass')) push('lean_mass_kg', kg(r.mass), when(r));
    for (const r of await read('ActiveCaloriesBurned')) {
      push(
        'active_calories',
        num((r.energy as { inKilocalories?: unknown } | undefined)?.inKilocalories),
        when(r),
      );
    }
    for (const r of await read('ExerciseSession')) {
      const start = r.startTime ? new Date(r.startTime as string) : null;
      const end = r.endTime ? new Date(r.endTime as string) : null;
      if (start && end && end > start) {
        push('exercise_minutes', Math.round((end.getTime() - start.getTime()) / 60000), end);
      }
    }
    return samples;
  }
}
