export type GymKind = 'forca' | 'cardio';

export interface GymExercise {
  kind: GymKind;
  /** MET do Compêndio de Atividades Físicas (intensidade típica). */
  met: number;
}

/** Catálogo de exercícios; os nomes exibidos ficam em strings.gym.exercises. */
export const GYM_EXERCISES = {
  supino: { kind: 'forca', met: 5 },
  agachamento: { kind: 'forca', met: 5.5 },
  leg_press: { kind: 'forca', met: 5 },
  remada: { kind: 'forca', met: 5 },
  puxada: { kind: 'forca', met: 5 },
  desenvolvimento: { kind: 'forca', met: 5 },
  rosca_direta: { kind: 'forca', met: 4 },
  abdominal: { kind: 'forca', met: 3.8 },
  esteira_caminhada: { kind: 'cardio', met: 4.3 },
  esteira_corrida: { kind: 'cardio', met: 8.3 },
  eliptico: { kind: 'cardio', met: 5 },
  bicicleta: { kind: 'cardio', met: 6.8 },
  danca: { kind: 'cardio', met: 5.5 },
  pilates: { kind: 'cardio', met: 3 },
  pular_corda: { kind: 'cardio', met: 10 },
  natacao: { kind: 'cardio', met: 6 },
} as const satisfies Record<string, GymExercise>;

export type GymExerciseKey = keyof typeof GYM_EXERCISES;

/** kcal = MET × 3,5 × peso(kg) / 200 × minutos (fórmula padrão de METs). */
export function cardioKcal(met: number, bodyKg: number, minutes: number): number {
  return Math.round(((met * 3.5 * bodyKg) / 200) * minutes);
}

/**
 * Força: o tempo da série é estimado (4 s por repetição + 75 s de descanso)
 * e o volume levantado dá um acréscimo pequeno.
 */
export function strengthKcal(
  met: number,
  bodyKg: number,
  sets: number,
  reps: number,
  weightKg: number | null,
): number {
  const minutes = (sets * (reps * 4 + 75)) / 60;
  const base = ((met * 3.5 * bodyKg) / 200) * minutes;
  const volumeBonus = (weightKg ?? 0) * reps * sets * 0.005;
  return Math.round(base + volumeBonus);
}

export function estimateKcal(
  exercise: GymExerciseKey,
  bodyKg: number,
  input: { sets?: number | null; reps?: number | null; weightKg?: number | null; minutes?: number | null },
): number | null {
  const def = GYM_EXERCISES[exercise];
  if (def.kind === 'cardio') {
    return input.minutes && input.minutes > 0 ? cardioKcal(def.met, bodyKg, input.minutes) : null;
  }
  return input.sets && input.reps && input.sets > 0 && input.reps > 0
    ? strengthKcal(def.met, bodyKg, input.sets, input.reps, input.weightKg ?? null)
    : null;
}
