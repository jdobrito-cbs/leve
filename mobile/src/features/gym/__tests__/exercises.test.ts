import { cardioKcal, estimateKcal, strengthKcal } from '../exercises';

test('cardio: fórmula de METs com peso corporal e minutos', () => {
  // 5 MET × 3,5 × 100 kg / 200 × 30 min = 262,5
  expect(cardioKcal(5, 100, 30)).toBe(263);
  expect(cardioKcal(8.3, 70, 20)).toBe(Math.round((8.3 * 3.5 * 70) / 200 * 20));
});

test('força: tempo estimado por séries/repetições + bônus do volume', () => {
  const semCarga = strengthKcal(5, 100, 3, 12, null);
  const comCarga = strengthKcal(5, 100, 3, 12, 40);
  expect(semCarga).toBeGreaterThan(30);
  expect(comCarga).toBeGreaterThan(semCarga); // levantar mais pesa no gasto
});

test('estimateKcal exige os campos do tipo do exercício', () => {
  expect(estimateKcal('danca', 80, { minutes: 45 })).toBeGreaterThan(100);
  expect(estimateKcal('danca', 80, { minutes: null })).toBeNull();
  expect(estimateKcal('supino', 80, { sets: 3, reps: 12, weightKg: 40 })).toBeGreaterThan(0);
  expect(estimateKcal('supino', 80, { sets: null, reps: 12 })).toBeNull();
});
