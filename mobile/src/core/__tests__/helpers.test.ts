import {
  ageFromIsoDate,
  brDateToIso,
  dayRangeUtc,
  formatDateBR,
  formatTimeHM,
  isoDateToBR,
  lastNDays,
  localDayKey,
  parseDateTimeBR,
} from '../datetime';

test('nascimento: conversões BR↔ISO e idade completa', () => {
  expect(brDateToIso('01/03/1990')).toBe('1990-03-01');
  expect(isoDateToBR('1990-03-01')).toBe('01/03/1990');
  expect(brDateToIso('31/02/1990')).toBeNull();
  const today = new Date(2026, 6, 17); // 17/07/2026
  expect(ageFromIsoDate('1990-03-01', today)).toBe(36);
  expect(ageFromIsoDate('1990-08-01', today)).toBe(35); // ainda não fez aniversário
  expect(ageFromIsoDate('2030-01-01', today)).toBeNull();
  expect(ageFromIsoDate('data-invalida', today)).toBeNull();
});

test('parseDateTimeBR aceita data/hora válidas e rejeita inválidas', () => {
  const d = parseDateTimeBR('07/07/2026', '14:30');
  expect(d?.getDate()).toBe(7);
  expect(d?.getHours()).toBe(14);
  expect(formatDateBR(d!)).toBe('07/07/2026');
  expect(formatTimeHM(d!)).toBe('14:30');
  expect(parseDateTimeBR('31/02/2026', '10:00')).toBeNull();
  expect(parseDateTimeBR('07-07-2026', '10:00')).toBeNull();
  expect(parseDateTimeBR('07/07/2026', '25:00')).toBeNull();
});
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
