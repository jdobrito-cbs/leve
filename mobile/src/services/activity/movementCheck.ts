import type { AppDb } from '@/db/client';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { getEntitlement, isPremium } from '@/features/premium/entitlement';
import { isLocked } from '@/features/premium/gates';
import { getHealthProvider, type HealthProvider } from '@/services/health/HealthProvider';
import { sendMovementAlert, type ReminderSettings } from '@/services/reminders/reminders';

const CHECK_THROTTLE_MS = 55 * 60 * 1000;
const WINDOW_MIN = 65;
const MIN_STEPS = 50;
const HOUR_START = 8;
const HOUR_END = 22;

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
  if (steps === null) return false;
  await setSetting(db, 'lastMovementCheckAt', now.toISOString());
  if (steps >= MIN_STEPS) return false;
  await sendMovementAlert();
  return true;
}
