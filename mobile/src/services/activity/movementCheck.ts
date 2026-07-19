import type { AppDb } from '@/db/client';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { getEntitlement, isPremium } from '@/features/premium/entitlement';
import { isLocked } from '@/features/premium/gates';
import { getHealthProvider, type HealthProvider } from '@/services/health/HealthProvider';
import { sendMovementAlert, type ReminderSettings } from '@/services/reminders/reminders';

/** 55 min (e não 60) para casar com o ciclo de 1h do sync sem perder por segundos. */
const CHECK_THROTTLE_MS = 55 * 60 * 1000;
/** Janela olhada para trás; folga sobre 1h cobre atraso de sincronização do relógio. */
const WINDOW_MIN = 65;
/** Abaixo disso conta como "sem movimento" — conservador para não incomodar à toa. */
const MIN_STEPS = 50;
/** Só avisa em horário acordado. */
const HOUR_START = 8;
const HOUR_END = 22; // exclusivo

/**
 * Verifica 1x por hora (mesmo ciclo do sync de saúde) se houve passos na última
 * hora; sem movimento, avisa para levantar e caminhar. Silencioso quando a fonte
 * de passos está indisponível (ex.: aparelho bloqueado) — nunca avisa no chute.
 * Retorna true quando um aviso foi enviado.
 */
export async function checkMovementIfDue(
  db: AppDb,
  provider?: HealthProvider,
  now: Date = new Date(),
): Promise<boolean> {
  const reminders = await getSetting<ReminderSettings>(db, 'reminders');
  if (!reminders?.movementEnabled) return false;
  const hour = now.getHours();
  if (hour < HOUR_START || hour >= HOUR_END) return false;
  if (isLocked('healthSync', isPremium(await getEntitlement(db)))) return false;
  const health = await getSetting<{ connected?: boolean }>(db, 'health');
  if (!health?.connected) return false;
  const last = await getSetting<string>(db, 'lastMovementCheckAt');
  if (last && now.getTime() - new Date(last).getTime() < CHECK_THROTTLE_MS) return false;

  const p = provider ?? getHealthProvider();
  const start = new Date(now.getTime() - WINDOW_MIN * 60 * 1000);
  const steps = await p.readStepsWindow(start, now);
  if (steps === null) return false; // fonte indisponível — tenta de novo na próxima
  await setSetting(db, 'lastMovementCheckAt', now.toISOString());
  if (steps >= MIN_STEPS) return false;
  await sendMovementAlert();
  return true;
}
