import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import { addWater, waterTotalForDay } from '@/db/waterRepo';
import { addWeight, latestWeight } from '@/db/weightRepo';
import { setSetting, getSetting } from '@/db/settingsRepo';
import { updateProfile, getProfile } from '@/db/profileRepo';
import { exportAllData, importAllData, wipeAllData } from '../exportData';
import { decryptBackup, deriveBackupKey, encryptBackup } from '../crypto';

jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
}));

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('export → wipe → import restaura os dados (TACO preservada)', async () => {
  const db = makeDb() as never;
  const day = new Date(2026, 6, 7, 10);
  await updateProfile(db, { name: 'Jorge', waterGoalMl: 2500 });
  await addWater(db, 500, day);
  await addWeight(db, 93.2, day);
  await setSetting(db, 'waterGoalAuto', false);

  const data = await exportAllData(db);
  expect(data.waterLogs).toHaveLength(1);

  await wipeAllData(db);
  expect(await getProfile(db)).toBeNull();
  expect(await waterTotalForDay(db, day)).toBe(0);

  await importAllData(db, data);
  expect((await getProfile(db))?.name).toBe('Jorge');
  expect(await waterTotalForDay(db, day)).toBe(500);
  expect((await latestWeight(db))?.weightKg).toBe(93.2);
  expect(await getSetting(db, 'waterGoalAuto')).toBe(false);
});

test('cripto E2E: roundtrip ok e chave errada falha', () => {
  const key = deriveBackupKey('senha-forte-123', 'jorge@exemplo.com');
  const payload = encryptBackup('{"oi":"leve"}', key);
  expect(payload.startsWith('v1.')).toBe(true);
  expect(decryptBackup(payload, key)).toBe('{"oi":"leve"}');

  const wrong = deriveBackupKey('outra-senha', 'jorge@exemplo.com');
  expect(() => decryptBackup(payload, wrong)).toThrow();
  expect(() => decryptBackup('lixo', key)).toThrow();
});
