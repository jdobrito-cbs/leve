import type { SleepNight } from '../HealthProvider';
import { typicalBedtime, typicalWakeTime } from '../sleepSchedule';

function night(d: number, sh: number, sm: number, eh: number, em: number): SleepNight {
  const startDay = sh >= 12 ? d : d + 1;
  return {
    start: new Date(2026, 6, startDay, sh, sm),
    end: new Date(2026, 6, d + 1, eh, em),
  };
}

test('hora típica de dormir é a mediana e atravessa a meia-noite sem quebrar', () => {
  const nights = [
    night(10, 22, 50, 6, 30),
    night(11, 23, 5, 6, 50),
    night(12, 23, 10, 7, 0),
    night(13, 23, 40, 7, 10),
    night(14, 0, 20, 8, 5),
  ];
  expect(typicalBedtime(nights)).toBe('23:10');
  expect(typicalWakeTime(nights)).toBe('07:00');
});

test('mediana resiste a uma noite atípica (soneca ou madrugada isolada)', () => {
  const nights = [
    night(10, 22, 55, 6, 55),
    night(11, 23, 0, 7, 0),
    night(12, 23, 5, 7, 5),
    night(13, 23, 0, 7, 0),
    { start: new Date(2026, 6, 15, 13, 0), end: new Date(2026, 6, 15, 16, 30) },
  ];
  expect(typicalBedtime(nights)).toBe('23:00');
  expect(typicalWakeTime(nights)).toBe('07:00');
});

test('sem noites suficientes devolve null', () => {
  const nights = [night(10, 23, 0, 7, 0), night(11, 23, 0, 7, 0)];
  expect(typicalBedtime(nights)).toBeNull();
  expect(typicalWakeTime(nights)).toBeNull();
  expect(typicalBedtime([])).toBeNull();
});
