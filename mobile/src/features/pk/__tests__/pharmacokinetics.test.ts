import type { DoseLog } from '@/core/types';
import { PK_PARAMS, estimateRelativeCurve, kaFromTmax } from '../pharmacokinetics';

const HOUR = 3600 * 1000;

function dose(medication: string, atMs: number, doseMg = 0.5): DoseLog {
  return {
    id: Math.round(atMs / HOUR),
    medication,
    doseMg,
    route: 'injecao',
    injectionSite: null,
    loggedAt: new Date(atMs).toISOString(),
    nextDoseAt: null,
  };
}

test('kaFromTmax reproduz o tmax pedido', () => {
  const ke = Math.LN2 / 168;
  const ka = kaFromTmax(ke, 48);
  const tmax = Math.log(ka / ke) / (ka - ke);
  expect(Math.abs(tmax - 48)).toBeLessThan(0.5);
});

test('curva: zero antes da dose, pico perto do tmax, decai após meia-vida, normalizada em 1', () => {
  const t0 = Date.UTC(2026, 5, 1);
  const now = new Date(t0 + 14 * 24 * HOUR);
  const curve = estimateRelativeCurve([dose('semaglutida', t0)], now);
  expect(curve).not.toBeNull();
  const points = curve!.points;
  const levelAt = (hoursFromDose: number) => {
    const target = t0 + hoursFromDose * HOUR;
    return points.reduce((best, p) =>
      Math.abs(p.timeMs - target) < Math.abs(best.timeMs - target) ? p : best,
    ).level;
  };
  expect(levelAt(-24)).toBe(0);
  const peak = Math.max(...points.map((p) => p.level));
  expect(peak).toBeCloseTo(1, 5);
  expect(levelAt(48)).toBeGreaterThan(0.9);
  expect(levelAt(48 + 168)).toBeLessThan(levelAt(48) * 0.65);
});

test('superposição: segunda dose eleva o nível; medicação desconhecida → null', () => {
  const t0 = Date.UTC(2026, 5, 1);
  const now = new Date(t0 + 10 * 24 * HOUR);
  const one = estimateRelativeCurve([dose('semaglutida', t0)], now)!;
  const two = estimateRelativeCurve(
    [dose('semaglutida', t0), dose('semaglutida', t0 + 7 * 24 * HOUR)],
    now,
  )!;
  expect(two.rawPeak).toBeGreaterThan(one.rawPeak);
  expect(estimateRelativeCurve([dose('minha medicação', t0)], now)).toBeNull();
  expect(Object.keys(PK_PARAMS)).toContain('tirzepatida');
});
