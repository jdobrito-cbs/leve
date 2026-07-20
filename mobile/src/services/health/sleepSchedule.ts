import type { SleepNight } from './HealthProvider';

function medianClockTime(dates: Date[], shiftMin: number, minCount: number): string | null {
  if (dates.length < minCount) return null;
  const shifted = dates
    .map((d) => (d.getHours() * 60 + d.getMinutes() + shiftMin) % (24 * 60))
    .sort((a, b) => a - b);
  const mid = shifted[Math.floor(shifted.length / 2)];
  const minutes = (mid - shiftMin + 24 * 60) % (24 * 60);
  const rounded = (Math.round(minutes / 5) * 5) % (24 * 60);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function typicalBedtime(nights: SleepNight[], minNights = 3): string | null {
  return medianClockTime(
    nights.map((n) => n.start),
    12 * 60,
    minNights,
  );
}

export function typicalWakeTime(nights: SleepNight[], minNights = 3): string | null {
  return medianClockTime(
    nights.map((n) => n.end),
    0,
    minNights,
  );
}
