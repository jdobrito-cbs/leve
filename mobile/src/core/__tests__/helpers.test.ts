import { dayRangeUtc, lastNDays, localDayKey } from '../datetime';
import { normalizeText, parseDecimalBR } from '../text';

test('dayRangeUtc cobre o dia local inteiro', () => {
  const d = new Date(2026, 6, 7, 15, 30);
  const { startIso, endIso } = dayRangeUtc(d);
  expect(new Date(startIso).getTime()).toBeLessThanOrEqual(d.getTime());
  expect(new Date(endIso).getTime()).toBeGreaterThan(d.getTime());
  expect(new Date(endIso).getTime() - new Date(startIso).getTime()).toBe(24 * 3600 * 1000);
});

test('lastNDays retorna N dias terminando hoje', () => {
  const today = new Date(2026, 6, 7);
  const days = lastNDays(3, today);
  expect(days).toHaveLength(3);
  expect(localDayKey(days[2])).toBe('2026-07-07');
  expect(localDayKey(days[0])).toBe('2026-07-05');
});

test('normalizeText remove acentos e caixa', () => {
  expect(normalizeText('Feijão CARIOCA cozido')).toBe('feijao carioca cozido');
});

test('parseDecimalBR aceita vírgula e rejeita inválido', () => {
  expect(parseDecimalBR('92,5')).toBe(92.5);
  expect(parseDecimalBR('92.5')).toBe(92.5);
  expect(parseDecimalBR('abc')).toBeNull();
  expect(parseDecimalBR('')).toBeNull();
  expect(parseDecimalBR('0')).toBe(0);
});
