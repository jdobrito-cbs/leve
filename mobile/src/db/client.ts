import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export type AppDb = ExpoSQLiteDatabase<typeof schema>;

let instance: AppDb | null = null;

function open(): AppDb {
  if (!instance) {
    instance = drizzle(openDatabaseSync('leve.db'), { schema });
  }
  return instance;
}

/**
 * Banco aberto de forma preguiçosa: o primeiro acesso acontece dentro do fluxo
 * de migração do app, então uma falha de ambiente (ex.: web sem
 * SharedArrayBuffer) cai na tela de erro amigável em vez de derrubar a árvore.
 */
export const db: AppDb = new Proxy({} as AppDb, {
  get(_target, prop) {
    const real = open() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});
