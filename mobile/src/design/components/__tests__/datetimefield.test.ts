import { maskDateBR, maskTimeHM } from '../DateTimeField';

test('maskDateBR formata progressivamente enquanto digita', () => {
  expect(maskDateBR('0')).toBe('0');
  expect(maskDateBR('07')).toBe('07');
  expect(maskDateBR('070')).toBe('07/0');
  expect(maskDateBR('0703')).toBe('07/03');
  expect(maskDateBR('07032026')).toBe('07/03/2026');
  expect(maskDateBR('07/03/2026')).toBe('07/03/2026'); // já formatado permanece
  expect(maskDateBR('070320269')).toBe('07/03/2026'); // dígito extra é descartado
});

test('maskTimeHM formata progressivamente enquanto digita', () => {
  expect(maskTimeHM('2')).toBe('2');
  expect(maskTimeHM('23')).toBe('23');
  expect(maskTimeHM('231')).toBe('23:1');
  expect(maskTimeHM('2317')).toBe('23:17');
  expect(maskTimeHM('23:17')).toBe('23:17');
  expect(maskTimeHM('23179')).toBe('23:17');
});
