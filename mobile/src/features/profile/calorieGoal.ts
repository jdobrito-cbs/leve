import type { SexOption } from '@/features/profile/useProfileForm';
import { basalMetabolicRate } from '@/features/report/bodyReport';

/**
 * Meta calórica automática: calorias para MANTER o peso-meta (Mifflin-St Jeor
 * com fator de rotina leve 1,2), arredondada de 50 em 50 e dentro da faixa da
 * régua do Perfil. Estimativa informativa — ajustável manualmente no Perfil.
 */
export function estimateCalorieGoal(
  sex: SexOption,
  goalWeightKg: number,
  heightCm: number,
  age: number,
): number {
  const bmr =
    sex === 'nao_informar'
      ? Math.round(
          (basalMetabolicRate('masculino', goalWeightKg, heightCm, age) +
            basalMetabolicRate('feminino', goalWeightKg, heightCm, age)) /
            2,
        )
      : basalMetabolicRate(sex, goalWeightKg, heightCm, age);
  const kcal = Math.round((bmr * 1.2) / 50) * 50;
  return Math.min(4000, Math.max(800, kcal));
}
