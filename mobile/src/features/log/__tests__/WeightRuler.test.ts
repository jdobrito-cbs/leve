import {
  RULER_MIN_KG,
  RULER_TICK_WIDTH,
  kgToOffset,
  offsetToKg,
} from '../WeightRuler';

test('régua de peso: conversões de 0,1 em 0,1 kg são simétricas e limitadas', () => {
  expect(offsetToKg(0)).toBe(RULER_MIN_KG);
  expect(offsetToKg(RULER_TICK_WIDTH)).toBe(30.1);
  expect(offsetToKg(kgToOffset(92.5))).toBe(92.5);
  expect(offsetToKg(kgToOffset(107.8))).toBe(107.8);
  expect(offsetToKg(-100)).toBe(RULER_MIN_KG); // não passa do mínimo
  expect(offsetToKg(10 ** 9)).toBe(250); // nem do máximo
  expect(kgToOffset(10)).toBe(0);
});
