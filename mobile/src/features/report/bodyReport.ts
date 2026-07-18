import { ageFromIsoDate } from '@/core/datetime';
import type { MetricType } from '@/core/metrics';
import type { AppDb } from '@/db/client';
import { latestMetric, metricSeries } from '@/db/metricsRepo';
import { getProfile } from '@/db/profileRepo';
import { listWeights, weightsSince } from '@/db/weightRepo';

/**
 * Relatório de composição corporal montado com os dados registrados no app
 * (balança/saúde conectada ou lançamentos manuais). Faixas de referência
 * padrão de bioimpedância; valores informativos — não é avaliação clínica.
 */

export interface RangedValue {
  value: number;
  min: number;
  max: number;
}

/** Linha da composição: a faixa sempre existe; o valor pode não ter registro. */
export interface CompositionRow {
  value: number | null;
  min: number;
  max: number;
}

export interface SeriesPoint {
  dayLabel: string; // 'DD/MM'
  value: number;
}

export interface BodyReport {
  name: string;
  sex: 'masculino' | 'feminino';
  age: number | null;
  heightCm: number;
  weightKg: number;
  generatedAt: Date;
  composition: {
    waterKg: CompositionRow;
    proteinKg: CompositionRow;
    fatKg: CompositionRow;
    boneKg: CompositionRow;
    muscleKg: CompositionRow;
    skeletalKg: CompositionRow;
  };
  bmi: RangedValue;
  fatPct: RangedValue | null;
  weightRange: RangedValue;
  /** Ajustes sugeridos (negativo = reduzir), como no relatório de balança. */
  weightAdjustKg: number;
  fatAdjustKg: number | null;
  muscleAdjustKg: number | null;
  indicators: {
    visceralFat: number | null;
    bmrKcal: number;
    fatFreeMassKg: number | null;
    subcutaneousPct: number | null;
    smi: number | null;
    bodyAge: number | null;
  };
  history: {
    weight: SeriesPoint[];
    muscle: SeriesPoint[];
    fatPct: SeriesPoint[];
  };
  score: number;
  suggestions: string[];
}

/** Faixas padrão como fração do peso corporal, por sexo. */
const PCT_RANGES: Record<'masculino' | 'feminino', Record<string, [number, number]>> = {
  masculino: {
    water: [0.5, 0.65],
    protein: [0.14, 0.18],
    fat: [0.1, 0.2],
    bone: [0.034, 0.042],
    muscle: [0.466, 0.58],
    skeletal: [0.293, 0.359],
  },
  feminino: {
    water: [0.45, 0.6],
    protein: [0.12, 0.16],
    fat: [0.18, 0.28],
    bone: [0.028, 0.036],
    muscle: [0.36, 0.495],
    skeletal: [0.243, 0.309],
  },
};

const FAT_PCT_RANGE = { masculino: [10, 20], feminino: [18, 28] } as const;

function ranged(value: number | null, weightKg: number, pct: [number, number]): CompositionRow {
  return {
    value,
    min: Math.round(weightKg * pct[0] * 10) / 10,
    max: Math.round(weightKg * pct[1] * 10) / 10,
  };
}

/** Linha com valor registrado → RangedValue; sem registro → null (para a pontuação). */
function withValue(row: CompositionRow): RangedValue | null {
  return row.value === null ? null : { value: row.value, min: row.min, max: row.max };
}

/** Média por dia — importações trazem várias amostras diárias e o gráfico vira rabisco. */
function dailyAverages(rows: Array<{ loggedAt: string; value: number }>): SeriesPoint[] {
  const byDay = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const day = r.loggedAt.slice(0, 10);
    const agg = byDay.get(day) ?? { sum: 0, n: 0 };
    agg.sum += r.value;
    agg.n += 1;
    byDay.set(day, agg);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, { sum, n }]) => ({
      dayLabel: `${day.slice(8, 10)}/${day.slice(5, 7)}`,
      value: Math.round((sum / n) * 10) / 10,
    }));
}

/** Taxa metabólica basal (Mifflin-St Jeor). */
export function basalMetabolicRate(
  sex: 'masculino' | 'feminino',
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === 'masculino' ? 5 : -161));
}

export function bmiOf(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

interface ScoreInput {
  fatPct: RangedValue | null;
  bmi: RangedValue;
  water: RangedValue | null;
  muscle: RangedValue | null;
  visceral: number | null;
}

/** Pontuação 0–100: começa em 100 e desconta por indicador fora da faixa. */
export function scoreOf(input: ScoreInput): number {
  let score = 100;
  const out = (r: RangedValue | null) => r !== null && (r.value < r.min || r.value > r.max);
  if (out(input.fatPct)) score -= 16;
  if (out(input.bmi)) score -= 10;
  if (out(input.water)) score -= 8;
  if (out(input.muscle)) score -= 8;
  if (input.visceral !== null && input.visceral > 9) score -= input.visceral > 12 ? 12 : 6;
  return Math.max(0, Math.min(100, score));
}

function suggestionsOf(input: ScoreInput): string[] {
  const s: string[] = [];
  if (input.fatPct && input.fatPct.value > input.fatPct.max) {
    s.push(
      'O percentual de gordura corporal está acima da faixa de referência. Priorize vegetais, grãos e proteínas de qualidade e combine com exercícios aeróbicos regulares.',
    );
  }
  if (input.muscle && input.muscle.value < input.muscle.min) {
    s.push('A massa muscular está abaixo da faixa: exercícios de força ajudam a preservá-la.');
  }
  if (input.visceral !== null && input.visceral > 9) {
    s.push('O grau de gordura visceral está elevado — atividade aeróbica regular tende a reduzi-lo.');
  }
  if (s.length === 0) {
    s.push('Seus indicadores estão dentro das faixas de referência. Continue com os bons hábitos.');
  }
  s.push('Relatório informativo gerado pelos seus registros — não substitui avaliação médica.');
  return s;
}

async function last(db: AppDb, type: MetricType): Promise<number | null> {
  return (await latestMetric(db, type))?.value ?? null;
}

export async function buildBodyReport(db: AppDb): Promise<BodyReport | null> {
  const profile = await getProfile(db);
  const weights = await listWeights(db, 30);
  const weight = weights[0]?.weightKg ?? null;
  if (!profile?.heightCm || weight === null) return null;
  const sex: 'masculino' | 'feminino' = profile.sex === 'feminino' ? 'feminino' : 'masculino';
  const age = profile.birthDate ? ageFromIsoDate(profile.birthDate) : null;
  const pct = PCT_RANGES[sex];

  const [fatPctV, waterKg, skeletalKg, muscleKg, leanKg, boneKg, visceral, subcut, proteinPct, metAge] =
    await Promise.all([
      last(db, 'body_fat_pct'),
      last(db, 'body_water_kg'),
      last(db, 'skeletal_muscle_kg'),
      last(db, 'muscle_mass_kg'),
      last(db, 'lean_mass_kg'),
      last(db, 'bone_mass_kg'),
      last(db, 'visceral_fat'),
      last(db, 'subcutaneous_fat_pct'),
      last(db, 'protein_pct'),
      last(db, 'metabolic_age'),
    ]);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const [muscleSeries, fatSeries, weights30] = await Promise.all([
    metricSeries(db, 'muscle_mass_kg', since30),
    metricSeries(db, 'body_fat_pct', since30),
    weightsSince(db, since30),
  ]);

  const fatKg = fatPctV !== null ? Math.round(weight * fatPctV) / 100 : null;
  const proteinKg = proteinPct !== null ? Math.round(weight * proteinPct) / 100 : null;
  const heightM = profile.heightCm / 100;
  const bmi: RangedValue = { value: bmiOf(weight, profile.heightCm), min: 18.5, max: 25 };
  const fatRange = FAT_PCT_RANGE[sex];
  const fatPct: RangedValue | null =
    fatPctV !== null ? { value: fatPctV, min: fatRange[0], max: fatRange[1] } : null;
  const weightRange: RangedValue = {
    value: weight,
    min: Math.round(18.5 * heightM * heightM * 10) / 10,
    max: Math.round(25 * heightM * heightM * 10) / 10,
  };

  const composition = {
    waterKg: ranged(waterKg, weight, pct.water),
    proteinKg: ranged(proteinKg, weight, pct.protein),
    fatKg: ranged(fatKg, weight, pct.fat),
    boneKg: ranged(boneKg, weight, pct.bone),
    muscleKg: ranged(muscleKg ?? leanKg, weight, pct.muscle),
    skeletalKg: ranged(skeletalKg, weight, pct.skeletal),
  };

  const weightAdjustKg = Math.min(0, Math.round((weightRange.max - weight) * 10) / 10);
  const fatAdjustKg =
    composition.fatKg.value !== null
      ? Math.min(0, Math.round((composition.fatKg.max - composition.fatKg.value) * 10) / 10)
      : null;
  const muscleAdjustKg =
    composition.muscleKg.value !== null
      ? Math.max(0, Math.round((composition.muscleKg.min - composition.muscleKg.value) * 10) / 10)
      : null;

  const scoreInput: ScoreInput = {
    fatPct,
    bmi,
    water: withValue(composition.waterKg),
    muscle: withValue(composition.muscleKg),
    visceral: visceral,
  };

  return {
    name: profile.name ?? '—',
    sex,
    age,
    heightCm: profile.heightCm,
    weightKg: weight,
    generatedAt: new Date(),
    composition,
    bmi,
    fatPct,
    weightRange,
    weightAdjustKg,
    fatAdjustKg,
    muscleAdjustKg,
    indicators: {
      visceralFat: visceral,
      bmrKcal: basalMetabolicRate(sex, weight, profile.heightCm, age ?? 40),
      fatFreeMassKg:
        fatPctV !== null ? Math.round(weight * (100 - fatPctV)) / 100 : (leanKg ?? null),
      subcutaneousPct: subcut,
      smi:
        skeletalKg !== null ? Math.round((skeletalKg / (heightM * heightM)) * 10) / 10 : null,
      bodyAge: metAge ?? null,
    },
    history: {
      weight: dailyAverages(
        weights30.map((w) => ({ loggedAt: w.loggedAt, value: w.weightKg })),
      ),
      muscle: dailyAverages(muscleSeries),
      fatPct: dailyAverages(fatSeries),
    },
    score: scoreOf(scoreInput),
    suggestions: suggestionsOf(scoreInput),
  };
}
