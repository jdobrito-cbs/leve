import { estimateCalorieGoal } from '../calorieGoal';

test('meta calórica automática segue Mifflin-St Jeor ×1,2 em passos de 50', () => {
  // Masculino, meta 80 kg, 175 cm, 36 anos: BMR 1719 → ×1,2 = 2062,8 → 2050.
  expect(estimateCalorieGoal('masculino', 80, 175, 36)).toBe(2050);
  // Feminino, meta 70 kg, 165 cm, 40 anos: BMR 1370 → ×1,2 = 1644 → 1650.
  expect(estimateCalorieGoal('feminino', 70, 165, 40)).toBe(1650);
});

test('sem sexo informado usa a média das fórmulas e respeita os limites', () => {
  const media = estimateCalorieGoal('nao_informar', 70, 165, 40);
  expect(media).toBeGreaterThan(estimateCalorieGoal('feminino', 70, 165, 40));
  expect(media).toBeLessThan(estimateCalorieGoal('masculino', 70, 165, 40));
  expect(estimateCalorieGoal('feminino', 30, 100, 90)).toBeGreaterThanOrEqual(800);
  expect(estimateCalorieGoal('masculino', 250, 230, 18)).toBeLessThanOrEqual(4000);
});
