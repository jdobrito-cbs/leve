import { normalizeText } from '@/core/text';
import type { DoseLog } from '@/core/types';

export interface PkParams {
  halfLifeHours: number;
  tmaxHours: number;
}

export const PK_PARAMS: Record<string, PkParams> = {
  semaglutida: { halfLifeHours: 168, tmaxHours: 48 },
  tirzepatida: { halfLifeHours: 120, tmaxHours: 24 },
  liraglutida: { halfLifeHours: 13, tmaxHours: 10 },
};

export function kaFromTmax(ke: number, tmaxHours: number): number {
  let lo = ke * 1.0001;
  let hi = 10;
  const tmaxOf = (ka: number) => Math.log(ka / ke) / (ka - ke);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tmaxOf(mid) > tmaxHours) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function bateman(hoursSinceDose: number, ke: number, ka: number): number {
  if (hoursSinceDose <= 0) return 0;
  return (
    (ka / (ka - ke)) * (Math.exp(-ke * hoursSinceDose) - Math.exp(-ka * hoursSinceDose))
  );
}

export interface PkPoint {
  timeMs: number;
  level: number;
}

export interface PkCurve {
  medKey: string;
  points: PkPoint[];
  rawPeak: number;
  latestDoseMg: number;
  endMgEstimate: number;
  peakIndex: number;
}

const STEP_HOURS = 6;
const PAST_DAYS = 30;
const FUTURE_DAYS = 7;

function pkKeyFor(medication: string): string | null {
  const norm = normalizeText(medication);
  return Object.keys(PK_PARAMS).find((k) => norm.includes(k)) ?? null;
}

export function estimateRelativeCurve(doses: DoseLog[], now: Date = new Date()): PkCurve | null {
  if (doses.length === 0) return null;
  const latest = [...doses].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0];
  const medKey = pkKeyFor(latest.medication);
  if (!medKey) return null;
  const params = PK_PARAMS[medKey];
  const ke = Math.LN2 / params.halfLifeHours;
  const ka = kaFromTmax(ke, params.tmaxHours);

  const relevant = doses.filter((d) => pkKeyFor(d.medication) === medKey);
  const start = now.getTime() - PAST_DAYS * 24 * 3600 * 1000;
  const end = now.getTime() + FUTURE_DAYS * 24 * 3600 * 1000;

  const points: PkPoint[] = [];
  for (let t = start; t <= end; t += STEP_HOURS * 3600 * 1000) {
    let level = 0;
    for (const d of relevant) {
      const hoursSince = (t - new Date(d.loggedAt).getTime()) / 3600 / 1000;
      level += d.doseMg * bateman(hoursSince, ke, ka);
    }
    points.push({ timeMs: t, level });
  }

  const rawPeak = Math.max(...points.map((p) => p.level));
  if (rawPeak <= 0) return null;

  const latestTime = new Date(latest.loggedAt).getTime();
  let peakIndex = 0;
  let peakLevel = -1;
  points.forEach((p, i) => {
    if (p.timeMs >= latestTime && p.level > peakLevel) {
      peakLevel = p.level;
      peakIndex = i;
    }
  });

  return {
    medKey,
    rawPeak,
    latestDoseMg: latest.doseMg,
    endMgEstimate: points[points.length - 1].level,
    peakIndex,
    points: points.map((p) => ({ timeMs: p.timeMs, level: p.level / rawPeak })),
  };
}
