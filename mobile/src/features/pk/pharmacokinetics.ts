import { normalizeText } from '@/core/text';
import type { DoseLog } from '@/core/types';

/**
 * Estimativa INFORMATIVA de nível relativo de medicação.
 * Modelo de um compartimento (equação de Bateman) com parâmetros públicos de
 * farmacocinética populacional. Não reflete o nível real de nenhuma pessoa e
 * não deve orientar decisão clínica.
 */

export interface PkParams {
  halfLifeHours: number;
  tmaxHours: number;
}

export const PK_PARAMS: Record<string, PkParams> = {
  semaglutida: { halfLifeHours: 168, tmaxHours: 48 },
  tirzepatida: { halfLifeHours: 120, tmaxHours: 24 },
  liraglutida: { halfLifeHours: 13, tmaxHours: 10 },
};

/** Resolve ka numericamente a partir de tmax = ln(ka/ke)/(ka−ke) (bisseção). */
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
  level: number; // 0..1 (relativo ao pico da janela)
}

export interface PkCurve {
  medKey: string;
  points: PkPoint[];
  rawPeak: number;
}

const STEP_HOURS = 6;
const PAST_DAYS = 30;
const FUTURE_DAYS = 7;

function pkKeyFor(medication: string): string | null {
  const norm = normalizeText(medication);
  return Object.keys(PK_PARAMS).find((k) => norm.includes(k)) ?? null;
}

/**
 * Curva relativa (30 dias passados + 7 futuros) por superposição das doses
 * registradas da medicação mais recente. null quando a medicação não tem
 * parâmetros públicos na tabela.
 */
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
  return {
    medKey,
    rawPeak,
    points: points.map((p) => ({ timeMs: p.timeMs, level: p.level / rawPeak })),
  };
}
