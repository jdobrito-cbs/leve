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

/** Gordura subcutânea (%): faixas usuais de bioimpedância. Baixo é bom. */
export function subcutaneousZones(sex: Sex): GaugeZone[] {
  const [a, b] = sex === 'feminino' ? [18.5, 26.7] : [8.6, 16.7];
  return [
    { to: a, label: L.low, color: ZONE.thin },
    { to: b, label: L.standard, color: ZONE.ok },
    { to: null, label: L.high, color: ZONE.bad },
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
    { to: 18.5, label: L.low, color: ZONE.thin },
    { to: 25, label: L.standard, color: ZONE.ok },
    { to: 30, label: L.high, color: ZONE.warn },
    { to: null, label: L.obesity, color: ZONE.bad },
  ];
}

/** Três zonas em torno da faixa padrão (kg).
 *  top 'excellent' (água/proteína/óssea/muscular/esquelético): faltar é ruim
 *  (baixo vermelho) e sobrar é ótimo (verde escuro). top 'high' (peso):
 *  baixo verde escuro, padrão verde, alto vermelho. */
export function bandZones(
  band: { min: number; max: number },
  top: 'high' | 'excellent',
): GaugeZone[] {
  return top === 'high'
    ? [
        { to: band.min, label: L.low, color: ZONE.thin },
        { to: band.max, label: L.standard, color: ZONE.ok },
        { to: null, label: L.high, color: ZONE.bad },
      ]
    : [
        { to: band.min, label: L.low, color: ZONE.bad },
        { to: band.max, label: L.standard, color: ZONE.ok },
        { to: null, label: L.excellent, color: ZONE.good },
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

/**
 * Geometria dos medidores, igual à da balança: cada zona ocupa a MESMA largura
 * visual e o marcador fica na posição proporcional DENTRO da sua zona.
 * Nas zonas abertas (início/fim), o avanço é assintótico em relação ao
 * excesso — o marcador se aproxima da borda sem nunca colar nela, evitando a
 * leitura falsa de "estourou a régua".
 * Retorna a fração 0..1 da largura total onde o marcador deve ficar.
 */
export function gaugeMarkerFraction(value: number, zones: GaugeZone[]): number {
  const bounds = zones.filter((z) => z.to !== null).map((z) => z.to as number);
  const n = zones.length;
  if (bounds.length === 0 || n === 0) return 0.5;

  let k = zones.findIndex((z) => z.to === null || value <= (z.to as number));
  if (k < 0) k = n - 1;

  const firstSpan = bounds.length > 1 ? bounds[1] - bounds[0] : Math.max(bounds[0] * 0.5, 1);
  const lastSpan =
    bounds.length > 1
      ? bounds[bounds.length - 1] - bounds[bounds.length - 2]
      : Math.max(bounds[0] * 0.5, 1);

  let f: number;
  if (k === 0) {
    // Primeira zona: aproxima da fronteira conforme o valor sobe até ela.
    const deficit = Math.max(0, bounds[0] - value);
    f = 1 - deficit / (deficit + firstSpan);
  } else if (zones[k].to === null) {
    // Última zona (aberta): avanço assintótico pelo excesso.
    const excess = Math.max(0, value - bounds[bounds.length - 1]);
    f = excess / (excess + lastSpan);
  } else {
    const a = bounds[k - 1];
    const b = zones[k].to as number;
    f = b > a ? (value - a) / (b - a) : 0.5;
  }
  return (k + Math.min(Math.max(f, 0), 1)) / n;
}

/**
 * Faixas-padrão dos sinais de saúde (box "Corpo e saúde" do Progresso).
 * Referências clínicas usuais: sono 7–9 h (National Sleep Foundation),
 * eficiência ≥85%, FC repouso 60–100 bpm (AHA), SpO₂ ≥95%, respiração
 * 12–20 rpm, distúrbios respiratórios <5/h (escala de apneia), cintura
 * OMS (94/102 cm masc; 80/88 fem).
 */
export function sleepZones(): GaugeZone[] {
  return [
    { to: 7, label: L.low, color: ZONE.bad },
    { to: 9, label: L.standard, color: ZONE.ok },
    { to: null, label: L.high, color: ZONE.warn },
  ];
}

export function sleepEfficiencyZones(): GaugeZone[] {
  return [
    { to: 85, label: L.low, color: ZONE.warn },
    { to: null, label: L.standard, color: ZONE.ok },
  ];
}

export function restingHrZones(): GaugeZone[] {
  return [
    { to: 60, label: L.low, color: ZONE.low },
    { to: 100, label: L.standard, color: ZONE.ok },
    { to: null, label: L.high, color: ZONE.bad },
  ];
}

export function spo2Zones(): GaugeZone[] {
  return [
    { to: 90, label: L.veryLow, color: ZONE.bad },
    { to: 95, label: L.low, color: ZONE.warn },
    { to: null, label: L.standard, color: ZONE.ok },
  ];
}

export function respiratoryZones(): GaugeZone[] {
  return [
    { to: 12, label: L.low, color: ZONE.low },
    { to: 20, label: L.standard, color: ZONE.ok },
    { to: null, label: L.high, color: ZONE.bad },
  ];
}

export function breathingZones(): GaugeZone[] {
  return [
    { to: 5, label: L.standard, color: ZONE.ok },
    { to: 15, label: L.high, color: ZONE.warn },
    { to: null, label: L.veryHigh, color: ZONE.bad },
  ];
}

export function waistZones(sex: Sex): GaugeZone[] {
  const [a, b] = sex === 'feminino' ? [80, 88] : [94, 102];
  return [
    { to: a, label: L.standard, color: ZONE.ok },
    { to: b, label: L.high, color: ZONE.warn },
    { to: null, label: L.veryHigh, color: ZONE.bad },
  ];
}

/** Posições (0..1) das fronteiras numéricas na régua de zonas iguais. */
export function gaugeBoundaryFractions(zones: GaugeZone[]): number[] {
  const n = zones.length;
  return zones
    .map((z, i) => (z.to !== null ? (i + 1) / n : null))
    .filter((v): v is number => v !== null);
}

/** WHR (cintura ÷ quadril): excelente | padrão | alto | muito alto (OMS). */
export function whrZones(sex: Sex): GaugeZone[] {
  const [a, b, c] = sex === 'feminino' ? [0.75, 0.8, 0.85] : [0.85, 0.9, 0.95];
  return [
    { to: a, label: L.excellent, color: ZONE.good },
    { to: b, label: L.standard, color: ZONE.ok },
    { to: c, label: L.high, color: ZONE.warn },
    { to: null, label: L.veryHigh, color: ZONE.bad },
  ];
}

/** Peso corporal ideal: IMC 22 (centro da faixa saudável) na altura da pessoa. */
export function idealBodyWeightKg(heightCm: number): number {
  return r1(22 * (heightCm / 100) ** 2);
}

/** Nível de obesidade pela escala da OMS (IMC). */
export function obesityLevelLabel(bmi: number): string {
  const O = strings.obesityLevels;
  if (bmi < 18.5) return O.under;
  if (bmi < 25) return O.normal;
  if (bmi < 30) return O.over;
  if (bmi < 35) return O.g1;
  if (bmi < 40) return O.g2;
  return O.g3;
}

/** Tipo de corpo: combinação da zona de gordura, IMC e massa muscular. */
export function bodyTypeLabel(
  sex: Sex,
  heightCm: number,
  bmi: number,
  fatPct: number | null,
  muscleKg: number | null,
): string | null {
  if (fatPct === null) return null;
  const T = strings.bodyTypes;
  const fatZone = zoneOf(fatPct, fatPctZones(sex)).label;
  const muscular =
    muscleKg !== null && muscleKg > componentBandKg(sex, heightCm, 'muscle').max;
  if (fatZone === L.veryHigh) return bmi >= 30 ? T.obese : T.overFat;
  if (fatZone === L.high) return bmi >= 25 ? T.overFat : T.hiddenFat;
  if (fatZone === L.thin) {
    if (bmi < 18.5) return T.slim;
    return muscular ? T.athletic : T.standard;
  }
  return muscular ? T.muscular : T.standard;
}
