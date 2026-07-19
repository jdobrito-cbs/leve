import type { SleepNight } from './HealthProvider';

/**
 * Horários típicos de dormir e acordar a partir das noites do app de saúde.
 * Usa a MEDIANA (resistente a noites atípicas). Para a hora de dormir, o
 * relógio "vira" à meia-noite (23:30 e 00:30 são vizinhos); deslocamos 12h
 * para o cluster noturno cair no meio da régua antes de ordenar.
 */
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

/** Hora típica de deitar (mín. 3 noites); null sem dados suficientes. */
export function typicalBedtime(nights: SleepNight[], minNights = 3): string | null {
  return medianClockTime(
    nights.map((n) => n.start),
    12 * 60,
    minNights,
  );
}

/** Hora típica de acordar (mín. 3 noites); null sem dados suficientes. */
export function typicalWakeTime(nights: SleepNight[], minNights = 3): string | null {
  // Acordar cluster de manhã (5h–11h) — longe da meia-noite, sem deslocamento.
  return medianClockTime(
    nights.map((n) => n.end),
    0,
    minNights,
  );
}
