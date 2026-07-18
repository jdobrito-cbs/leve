import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import { getEntitlement, setEntitlement } from '../entitlement';
import {
  isServerPartnerKey,
  revalidatePartnerIfDue,
  validatePartnerKey,
} from '../partnerServer';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db as never;
}

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.EXPO_PUBLIC_LEVE_SERVER_URL;
});

test('reconhece o formato curto do servidor e ignora o formato longo offline', () => {
  expect(isServerPartnerKey('leve-ab2c-d3ef-gh4j')).toBe(true);
  expect(isServerPartnerKey('  LEVE-AAAA-BBBB-CCCC ')).toBe(true);
  expect(isServerPartnerKey('LEVE-abcdefghijklmnopqrstuvwx')).toBe(false);
  expect(isServerPartnerKey('LEVE-AAAA-BBBB')).toBe(false);
});

test('validatePartnerKey: sem servidor configurado → null; resposta do servidor é repassada', async () => {
  expect(await validatePartnerKey('LEVE-AAAA-BBBB-CCCC')).toBeNull();

  process.env.EXPO_PUBLIC_LEVE_SERVER_URL = 'http://leve.test';
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ valid: true, label: 'Dra. Ana' }),
  }) as never;
  expect(await validatePartnerKey('LEVE-AAAA-BBBB-CCCC')).toEqual({
    valid: true,
    label: 'Dra. Ana',
  });

  global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as never;
  expect(await validatePartnerKey('LEVE-AAAA-BBBB-CCCC')).toBeNull();
});

test('revalidação derruba a chave revogada e mantém acesso quando offline', async () => {
  process.env.EXPO_PUBLIC_LEVE_SERVER_URL = 'http://leve.test';
  const db = makeDb();
  await setEntitlement(db, {
    plan: 'partner',
    licenseId: 'Dra. Ana',
    partnerKey: 'LEVE-AAAA-BBBB-CCCC',
  });

  // Offline: nada muda e o próximo ciclo tenta de novo.
  global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as never;
  await revalidatePartnerIfDue(db);
  expect((await getEntitlement(db)).plan).toBe('partner');

  // Servidor diz que foi revogada → volta ao gratuito.
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ valid: false }),
  }) as never;
  await revalidatePartnerIfDue(db);
  expect((await getEntitlement(db)).plan).toBe('free');
});
