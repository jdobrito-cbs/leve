import { RULER_TICK_WIDTH, offsetToValue, valueToOffset } from '../ValueRuler';

test('régua: conversões simétricas e limitadas para peso (0,1 kg)', () => {
  expect(offsetToValue(0, 30, 250, 0.1)).toBe(30);
  expect(offsetToValue(RULER_TICK_WIDTH, 30, 250, 0.1)).toBeCloseTo(30.1);
  expect(offsetToValue(valueToOffset(92.5, 30, 250, 0.1), 30, 250, 0.1)).toBeCloseTo(92.5);
  expect(offsetToValue(-100, 30, 250, 0.1)).toBe(30);
  expect(offsetToValue(10 ** 9, 30, 250, 0.1)).toBe(250);
});

test('régua: altura de 1 em 1 cm e dose de 0,1 em 0,1 mg', () => {
  expect(offsetToValue(valueToOffset(178, 100, 230, 1), 100, 230, 1)).toBe(178);
  expect(valueToOffset(100, 100, 230, 1)).toBe(0);
  expect(offsetToValue(valueToOffset(0.5, 0, 30, 0.1), 0, 30, 0.1)).toBeCloseTo(0.5);
  expect(offsetToValue(valueToOffset(2.4, 0, 30, 0.1), 0, 30, 0.1)).toBeCloseTo(2.4);
});
