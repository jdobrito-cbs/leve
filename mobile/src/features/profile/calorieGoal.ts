import type { SexOption } from '@/features/profile/useProfileForm';
import { basalMetabolicRate } from '@/features/report/bodyReport';

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
