import {
  cmToFtIn,
  displayToKg,
  displayToMl,
  formatHeight,
  formatVolume,
  formatWeight,
  getUnitSystem,
  kgToDisplay,
  mlToDisplay,
  setUnitSystem,
  subscribeUnits,
  volumeUnit,
  weightUnit,
} from '../units';

afterEach(() => setUnitSystem('metric'));

test('trocar o sistema de medidas notifica assinantes (o app re-renderiza)', () => {
  const seen: string[] = [];
  const off = subscribeUnits(() => seen.push(getUnitSystem()));
  setUnitSystem('imperial');
  expect(seen).toEqual(['imperial']);
  off();
  setUnitSystem('metric');
  expect(seen).toEqual(['imperial']); // cancelado: não recebe mais
});

test('métrico é identidade', () => {
  setUnitSystem('metric');
  expect(kgToDisplay(98)).toBe(98);
  expect(mlToDisplay(500)).toBe(500);
  expect(weightUnit()).toBe('kg');
  expect(volumeUnit()).toBe('ml');
  expect(formatWeight(98)).toContain('kg');
  expect(formatHeight(175)).toBe('175 cm');
});

test('imperial converte e volta sem perda relevante', () => {
  setUnitSystem('imperial');
  expect(kgToDisplay(100)).toBeCloseTo(220.46, 1);
  expect(displayToKg(kgToDisplay(98))).toBeCloseTo(98, 6);
  expect(mlToDisplay(500)).toBeCloseTo(16.9, 1);
  expect(displayToMl(mlToDisplay(300))).toBeCloseTo(300, 6);
  expect(weightUnit()).toBe('lb');
  expect(volumeUnit()).toBe('fl oz');
  expect(formatWeight(98)).toContain('lb');
  expect(formatVolume(500)).toContain('fl oz');
});

test('altura imperial em pés e polegadas', () => {
  setUnitSystem('imperial');
  expect(formatHeight(175)).toBe(`5'9"`); // 175 cm ≈ 68,9 in → 5 ft 9 in
  expect(cmToFtIn(183)).toEqual({ ft: 6, inches: 0 });
});
