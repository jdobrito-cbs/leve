const mockAlert = jest.fn();
jest.mock('@/services/reminders/reminders', () => ({
  sendMovementAlert: (...a: unknown[]) => mockAlert(...a),
}));

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import { getSetting, setSetting } from '@/db/settingsRepo';
import type { HealthProvider } from '@/services/health/HealthProvider';
import { checkMovementIfDue } from '../movementCheck';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db as never;
}

function provider(steps: number | null): HealthProvider {
  return {
    isAvailable: async () => true,
    requestPermissions: async () => true,
    readWeight: async () => [],
    readSteps: async () => [],
    readMetrics: async () => [],
    readSleepNights: async () => [],
    readStepsWindow: async () => steps,
  };
}

async function readyDb() {
  const db = makeDb();
  await setSetting(db, 'reminders', { doseEnabled: false, waterEnabled: false, waterTimes: [], movementEnabled: true });
  await setSetting(db, 'entitlement', { plan: 'partner' });
  await setSetting(db, 'health', { connected: true });
  return db;
}

const at10h = new Date(2026, 6, 17, 10, 0);

beforeEach(() => mockAlert.mockClear());

test('sem passos na última hora avisa; com passos não; throttle de ~1h segura', async () => {
  const db = await readyDb();
  expect(await checkMovementIfDue(db, provider(10), at10h)).toBe(true);
  expect(mockAlert).toHaveBeenCalledTimes(1);
  // 30 min depois: dentro do throttle, nem lê os passos de novo.
  const at1030 = new Date(2026, 6, 17, 10, 30);
  expect(await checkMovementIfDue(db, provider(0), at1030)).toBe(false);
  expect(mockAlert).toHaveBeenCalledTimes(1);
  // 1h depois, movimento suficiente → sem aviso.
  const at11h = new Date(2026, 6, 17, 11, 0);
  expect(await checkMovementIfDue(db, provider(800), at11h)).toBe(false);
  expect(mockAlert).toHaveBeenCalledTimes(1);
});

test('fonte de passos indisponível: silêncio e sem gravar verificação', async () => {
  const db = await readyDb();
  expect(await checkMovementIfDue(db, provider(null), at10h)).toBe(false);
  expect(mockAlert).not.toHaveBeenCalled();
  expect(await getSetting(db, 'lastMovementCheckAt')).toBeNull();
});

test('desligado, fora do horário acordado ou sem premium: não roda', async () => {
  const db = await readyDb();
  const night = new Date(2026, 6, 17, 23, 0);
  expect(await checkMovementIfDue(db, provider(0), night)).toBe(false);
  await setSetting(db, 'reminders', { doseEnabled: false, waterEnabled: false, waterTimes: [], movementEnabled: false });
  expect(await checkMovementIfDue(db, provider(0), at10h)).toBe(false);
  await setSetting(db, 'reminders', { doseEnabled: false, waterEnabled: false, waterTimes: [], movementEnabled: true });
  await setSetting(db, 'entitlement', { plan: 'free' });
  expect(await checkMovementIfDue(db, provider(0), at10h)).toBe(false);
  expect(mockAlert).not.toHaveBeenCalled();
});
