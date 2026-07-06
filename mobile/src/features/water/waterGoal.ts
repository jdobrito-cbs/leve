import type { AppDb } from '@/db/client';
import { getProfile } from '@/db/profileRepo';
import { getSetting } from '@/db/settingsRepo';
import { latestWeight } from '@/db/weightRepo';

export const ML_PER_KG = 35;

/** Regra geral de hidratação (35 ml/kg), arredondada a 50 ml e com piso de 1000 ml. Estimativa informativa. */
export function waterGoalFromWeightKg(weightKg: number): number {
  return Math.max(1000, Math.round((weightKg * ML_PER_KG) / 50) * 50);
}

export interface EffectiveWaterGoal {
  goalMl: number;
  auto: boolean;
}

/**
 * Meta efetiva de água: automática (peso mais recente × 35 ml/kg) por padrão;
 * manual (perfil) quando o usuário desligar o cálculo automático ou não houver peso.
 */
export async function getEffectiveWaterGoal(db: AppDb): Promise<EffectiveWaterGoal> {
  const auto = (await getSetting<boolean>(db, 'waterGoalAuto')) ?? true;
  if (auto) {
    const weight = await latestWeight(db);
    if (weight) return { goalMl: waterGoalFromWeightKg(weight.weightKg), auto: true };
  }
  const profile = await getProfile(db);
  return { goalMl: profile?.waterGoalMl ?? 2000, auto };
}
