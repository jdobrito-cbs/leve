/**
 * Faixas de referência dos dados corporais, no modelo das balanças de
 * bioimpedância (calibradas com as medidas reais da balança do dono):
 * as faixas em kg derivam do PESO-IDEAL (IMC 18,5–25 — referência CDC),
 * não do peso atual. Percentuais e índices usam faixas padrão publicadas.
 * Valores informativos — não substituem avaliação médica.
 */

import { strings } from '@/i18n/pt-BR';

export type Sex = 'masculino' | 'feminino';

const L = strings.gauge;

export interface GaugeZone {
  /** Limite superior da zona (null = aberta até o fim da régua). */
  to: number | null;
  label: string;
  color: string;
}

export interface GaugeSpec {
  key: string;
  label: string;
  unit: string;
  /** Valor atual (null = sem registro). */
  value: number | null;
  zones: GaugeZone[];
  /** Casas decimais na exibição. */
  digits: number;
}

// Cores das zonas (mesma paleta dos medidores da balança).
export const ZONE = {
  low: '#60A5FA', // azul — abaixo
  thin: '#15803D', // verde-escuro — "fino"
  ok: '#4ADE80', // verde — padrão
  good: '#15803D', // verde-escuro — excelente
  warn: '#F59E0B', // laranja — alto
  bad: '#EF4444', // vermelho — muito alto
} as const;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Peso-ideal pela faixa saudável de IMC (18,5–25). */
export function idealWeightBounds(heightCm: number): { min: number; max: number } {
  const m2 = (heightCm / 100) ** 2;
  return { min: r1(18.5 * m2), max: r1(25 * m2) };
}

/** Razões medidas na balança do dono (masculino), aplicadas ao peso-ideal.
 *  Feminino ajustado pelas proporções fisiológicas usuais. */
const COMPONENT_RATIOS: Record<
  Sex,
  Record<'fat' | 'water' | 'protein' | 'bone' | 'muscle' | 'skeletal', [number, number]>
> = {
  masculino: {
    fat: [0.141, 0.208],
    water: [0.63, 0.58],
    protein: [0.171, 0.159],
    bone: [0.058, 0.053],
    muscle: [0.803, 0.739],
    skeletal: [0.506, 0.457],
  },
  feminino: {
    fat: [0.204, 0.301],
    water: [0.586, 0.539],
    protein: [0.157, 0.146],
    bone: [0.055, 0.05],
    muscle: [0.699, 0.643],
    skeletal: [0.43, 0.388],
  },
};

/** Faixa "padrão" (min–max) de um componente em kg, pelo peso-ideal. */
export function componentBandKg(
  sex: Sex,
  heightCm: number,
  component: keyof (typeof COMPONENT_RATIOS)['masculino'],
): { min: number; max: number } {
  const ideal = idealWeightBounds(heightCm);
  const [rLow, rHigh] = COMPONENT_RATIOS[sex][component];
  return { min: r1(rLow * ideal.min), max: r1(rHigh * ideal.max) };
}

/** % de gordura corporal: fino | padrão | alto | muito alto. */
export function fatPctZones(sex: Sex): GaugeZone[] {
  const [a, b, c] = sex === 'feminino' ? [18, 28, 33] : [10, 20, 25];
  return [
    { to: a, label: L.thin, color: ZONE.thin },
    { to: b, label: L.standard, color: ZONE.ok },
    { to: c, label: L.high, color: ZONE.warn },
    { to: null, label: L.veryHigh, color: ZONE.bad },
  ];
}

/** Gordura subcutânea (%): faixas usuais de bioimpedância. */
export function subcutaneousZones(sex: Sex): GaugeZone[] {
  const [a, b] = sex === 'feminino' ? [18.5, 26.7] : [8.6, 16.7];
  return [
    { to: a, label: L.low, color: ZONE.low },
    { to: b, label: L.standard, color: ZONE.ok },
    { to: null, label: L.high, color: ZONE.warn },
  ];
}

/** Gordura visceral (grau): 1–9 padrão · 10–14 alto · 15+ muito alto. */
export function visceralZones(): GaugeZone[] {
  return [
    { to: 9.5, label: L.standard, color: ZONE.ok },
    { to: 14.5, label: L.high, color: ZONE.warn },
    { to: null, label: L.veryHigh, color: ZONE.bad },
  ];
}

/** IMC (CDC): abaixo | saudável | sobrepeso | obesidade. */
export function bmiZones(): GaugeZone[] {
  return [
    { to: 18.5, label: L.low, color: ZONE.low },
    { to: 25, label: L.standard, color: ZONE.ok },
    { to: 30, label: L.high, color: ZONE.warn },
    { to: null, label: L.obesity, color: ZONE.bad },
  ];
}

/** Três zonas em torno da faixa padrão (kg): baixo | padrão | topo. */
export function bandZones(
  band: { min: number; max: number },
  top: 'high' | 'excellent',
): GaugeZone[] {
  return [
    { to: band.min, label: L.low, color: ZONE.low },
    { to: band.max, label: L.standard, color: ZONE.ok },
    top === 'high'
      ? { to: null, label: L.high, color: ZONE.bad }
      : { to: null, label: L.excellent, color: ZONE.good },
  ];
}

/** Quatro zonas da massa gorda em kg: fino | padrão | alto | muito alto. */
export function fatMassZones(sex: Sex, heightCm: number): GaugeZone[] {
  const band = componentBandKg(sex, heightCm, 'fat');
  const ideal = idealWeightBounds(heightCm);
  const high = r1(band.max + 0.06 * ideal.max);
  return [
    { to: band.min, label: L.thin, color: ZONE.thin },
    { to: band.max, label: L.standard, color: ZONE.ok },
    { to: high, label: L.high, color: ZONE.warn },
    { to: null, label: L.veryHigh, color: ZONE.bad },
  ];
}

/** Situação do valor dentro das zonas (rótulo + cor da zona onde caiu). */
export function zoneOf(value: number, zones: GaugeZone[]): GaugeZone {
  for (const zone of zones) {
    if (zone.to === null || value <= zone.to) return zone;
  }
  return zones[zones.length - 1];
}
