import { Platform } from 'react-native';
import { localDayKey } from '@/core/datetime';
import type { LogOrigin } from '@/core/types';
import type { AppDb } from '@/db/client';
import { addMetric, importedMetricKeys } from '@/db/metricsRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { addWeight, weightsSince } from '@/db/weightRepo';
import { getEntitlement, isPremium } from '@/features/premium/entitlement';
import { isLocked } from '@/features/premium/gates';
import {
  applyMorningWaterReminder,
  applySleepReminder,
  DEFAULT_REMINDERS,
  type ReminderSettings,
} from '@/services/reminders/reminders';
import { getHealthProvider, type HealthProvider } from './HealthProvider';
import { typicalBedtime, typicalWakeTime } from './sleepSchedule';

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

/** Importa métricas de saúde (sono, FC, composição corporal etc.) com dedup. */
export async function importMetrics(
  db: AppDb,
  provider: HealthProvider,
  sinceDays = 30,
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const samples = await provider.readMetrics(since);
  if (samples.length === 0) return 0;
  const origin: LogOrigin = Platform.OS === 'ios' ? 'healthkit' : 'healthconnect';
  const seen = await importedMetricKeys(db);
  let count = 0;
  for (const sample of samples) {
    const key = `${sample.type}|${sample.takenAt.toISOString()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await addMetric(db, sample.type, sample.value, sample.takenAt, origin);
    count++;
  }
  return count;
}

const SYNC_THROTTLE_MS = 60 * 60 * 1000; // 1 h

/**
 * Sync automático (balança/relógio → app de saúde → Leve sem toque): roda na
 * abertura do app e ao focar o Hoje, no máximo 1x por hora.
 * Exclusivo do Leve Premium — sem assinatura ativa, nada é buscado.
 */
export async function autoSyncIfDue(db: AppDb, provider?: HealthProvider): Promise<boolean> {
  if (isLocked('healthSync', isPremium(await getEntitlement(db)))) return false;
  const health = await getSetting<{ connected?: boolean }>(db, 'health');
  if (!health?.connected) return false;
  const last = await getSetting<string>(db, 'lastHealthSyncAt');
  if (last && Date.now() - new Date(last).getTime() < SYNC_THROTTLE_MS) return false;
  const p = provider ?? getHealthProvider();
  await importWeights(db, p);
  await importMetrics(db, p);
  await detectSleepSchedule(db, p).catch(() => undefined);
  await setSetting(db, 'lastHealthSyncAt', new Date().toISOString());
  return true;
}

/**
 * Detecta os horários típicos de dormir e acordar (últimas 14 noites) e guarda
 * como sugestão. Se o lembrete correspondente está ligado no modo automático,
 * reagenda com o horário novo; horário fixado pelo usuário nunca é alterado.
 */
export async function detectSleepSchedule(db: AppDb, provider: HealthProvider): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const nights = await provider.readSleepNights(since);
  const bed = typicalBedtime(nights);
  const wake = typicalWakeTime(nights);
  if (!bed && !wake) return;
  if (bed) await setSetting(db, 'sleepBedtimeDetected', bed);
  if (wake) await setSetting(db, 'sleepWakeDetected', wake);

  const r =
    (await getSetting<ReminderSettings>(db, 'reminders')) ?? DEFAULT_REMINDERS;
  let changed = false;
  if (bed && r.sleepEnabled && r.sleepAuto !== false && r.sleepTime !== bed) {
    r.sleepTime = bed;
    await applySleepReminder(true, bed);
    changed = true;
  }
  if (wake && r.wakeEnabled && r.wakeAuto !== false && r.wakeTime !== wake) {
    r.wakeTime = wake;
    await applyMorningWaterReminder(true, wake);
    changed = true;
  }
  if (changed) await setSetting(db, 'reminders', r);
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
