import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
import type { MetricSample, MetricType } from '@/core/metrics';
import { aggregateSleepNights, type HealthProvider, type SleepNight, type StepsSample, type WeightSample, type WorkoutSample } from './HealthProvider';

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
    permissions: { accessType: 'read'; recordType: string }[],
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
  'Distance',
];

function getModule(): HealthConnectModule | null {
  try {
    return require('react-native-health-connect') as HealthConnectModule;
  } catch {
    return null;
  }
}

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

  async readHeartRateWindow(start: Date, end: Date): Promise<number | null> {
    if (!this.mod) return null;
    try {
      const { records } = await this.mod.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
      });
      let sum = 0;
      let n = 0;
      for (const r of records as { samples?: { beatsPerMinute?: number }[] }[]) {
        for (const s of r.samples ?? []) {
          const bpm = s.beatsPerMinute;
          if (typeof bpm === 'number' && bpm > 0) {
            sum += bpm;
            n += 1;
          }
        }
      }
      return n > 0 ? sum / n : null;
    } catch {
      return null;
    }
  }

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
      return aggregateSleepNights(
        (records as { startTime?: string; endTime?: string }[])
          .filter((r) => r.startTime && r.endTime)
          .map((r) => ({ start: new Date(r.startTime!), end: new Date(r.endTime!) })),
      );
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
      const stages =
        (r.stages as { startTime?: string; endTime?: string; stage?: number }[] | undefined) ??
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
      const s = (r.samples as { beatsPerMinute?: unknown }[] | undefined) ?? [];
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

  async readWorkouts(since: Date): Promise<WorkoutSample[]> {
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
    const [sessions, distances, calories] = await Promise.all([
      read('ExerciseSession'),
      read('Distance'),
      read('ActiveCaloriesBurned'),
    ]);
    const sumInWindow = (
      recs: Record<string, unknown>[],
      s: number,
      e: number,
      get: (r: Record<string, unknown>) => number | null,
    ): number =>
      recs.reduce((acc, r) => {
        const t = new Date((r.startTime ?? r.time) as string).getTime();
        return Number.isFinite(t) && t >= s && t <= e ? acc + (get(r) ?? 0) : acc;
      }, 0);
    const typeOf = (n: unknown): 'run' | 'walk' | 'other' =>
      n === 56 || n === 57 ? 'run' : n === 79 ? 'walk' : 'other';
    const out: WorkoutSample[] = [];
    for (const r of sessions) {
      const start = r.startTime ? new Date(r.startTime as string) : null;
      if (!start || !Number.isFinite(start.getTime())) continue;
      const end = r.endTime ? new Date(r.endTime as string) : null;
      const s = start.getTime();
      const e = end ? end.getTime() : Date.now();
      const distM = sumInWindow(distances, s, e, (x) =>
        num((x.distance as { inMeters?: unknown } | undefined)?.inMeters),
      );
      const cal = sumInWindow(calories, s, e, (x) =>
        num((x.energy as { inKilocalories?: unknown } | undefined)?.inKilocalories),
      );
      const routeRaw =
        (r.exerciseRoute as { route?: unknown[] } | undefined)?.route ??
        (r.route as unknown[] | undefined) ??
        null;
      const route = Array.isArray(routeRaw)
        ? (routeRaw as Record<string, unknown>[])
            .map((p) => ({ lat: num(p.latitude) ?? Number.NaN, lng: num(p.longitude) ?? Number.NaN }))
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        : null;
      out.push({
        externalId: (r.metadata as { id?: string } | undefined)?.id ?? null,
        type: typeOf(r.exerciseType),
        startAt: start.toISOString(),
        endAt: end ? end.toISOString() : null,
        durationSec: end ? Math.round((e - s) / 1000) : null,
        distanceM: distM > 0 ? Math.round(distM) : null,
        calories: cal > 0 ? Math.round(cal) : null,
        route: route && route.length > 0 ? route : null,
      });
    }
    return out;
  }
}
