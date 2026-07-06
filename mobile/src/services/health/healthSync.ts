import { localDayKey } from '@/core/datetime';
import type { LogOrigin } from '@/core/types';
import type { AppDb } from '@/db/client';
import { addWeight, weightsSince } from '@/db/weightRepo';
import type { HealthProvider } from './HealthProvider';

/**
 * Importa pesos do provider para o banco local (opt-in, acionado pelo usuário).
 * Idempotente: amostras com o mesmo timestamp e origem de saúde não são duplicadas.
 * Retorna o número de registros importados.
 */
export async function importWeights(
  db: AppDb,
  provider: HealthProvider,
  sinceDays = 90,
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const samples = await provider.readWeight(since);
  if (samples.length === 0) return 0;

  const existing = await weightsSince(db, new Date(0));
  const imported = new Set(
    existing.filter((w) => w.origin !== 'manual').map((w) => w.loggedAt),
  );

  let count = 0;
  for (const sample of samples) {
    const iso = sample.takenAt.toISOString();
    if (imported.has(iso)) continue;
    await addWeight(db, sample.kg, sample.takenAt, sample.source as LogOrigin);
    count++;
  }
  return count;
}

/** Passos de hoje segundo o provider; null quando não há dado (ou provider indisponível). */
export async function readTodaySteps(
  provider: HealthProvider,
  today: Date = new Date(),
): Promise<number | null> {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const steps = await provider.readSteps(start);
  const entry = steps.find((s) => s.date === localDayKey(today));
  return entry ? entry.count : null;
}
