import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { strings } from '@/i18n/pt-BR';
import migrations from './migrations/migrations';
import * as schema from './schema';

export type AppDb = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>;

let instance: AppDb | null = null;
let initPromise: Promise<AppDb> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isDbLockedError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return msg.includes('Access Handle') || msg.includes('NoModificationAllowedError');
}

async function runMigrations(sqlite: SQLiteDatabase): Promise<void> {
  await sqlite.execAsync('CREATE TABLE IF NOT EXISTS __leve_migrations (idx INTEGER PRIMARY KEY)');
  for (const entry of migrations.journal.entries) {
    const done = await sqlite.getFirstAsync(
      'SELECT idx FROM __leve_migrations WHERE idx = ?',
      entry.idx,
    );
    if (done) continue;
    const key = `m${String(entry.idx).padStart(4, '0')}`;
    const sql = migrations.migrations[key];
    if (!sql) throw new Error(`migration ausente: ${key}`);
    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed) await sqlite.execAsync(trimmed);
    }
    await sqlite.runAsync('INSERT INTO __leve_migrations (idx) VALUES (?)', entry.idx);
  }
}

async function openWebDatabase(
  expoSqlite: typeof import('expo-sqlite'),
): Promise<SQLiteDatabase> {
  for (let attempt = 0; ; attempt++) {
    let opened: SQLiteDatabase | null = null;
    try {
      opened = await expoSqlite.openDatabaseAsync('leve.db');
      await runMigrations(opened);
      return opened;
    } catch (e) {
      if (opened) await opened.closeAsync().catch(() => undefined);
      if (!isDbLockedError(e) || attempt >= 4) throw e;
      await sleep(700);
    }
  }
}

async function create(): Promise<AppDb> {
  const expoSqlite = await import('expo-sqlite');

  if (Platform.OS === 'web') {
    if (typeof globalThis.isSecureContext === 'boolean' && !globalThis.isSecureContext) {
      throw new Error(strings.common.dbInsecureContext);
    }
    const sqlite = await openWebDatabase(expoSqlite);
    const { drizzle } = await import('drizzle-orm/sqlite-proxy');
    const db = drizzle(
      async (sql, params, method) => {
        const stmt = await sqlite.prepareAsync(sql);
        try {
          const result = await stmt.executeForRawResultAsync((params ?? []) as never[]);
          if (method === 'run') return { rows: [] };
          const rows = await result.getAllAsync();
          if (method === 'get') return { rows: (rows[0] as unknown[]) ?? [] };
          return { rows };
        } finally {
          await stmt.finalizeAsync();
        }
      },
      { schema },
    );
    return db as unknown as AppDb;
  }

  console.log('[leve] abrindo banco nativo…');
  const sqlite = expoSqlite.openDatabaseSync('leve.db');
  console.log('[leve] banco aberto; aplicando migrations…');
  await runMigrations(sqlite);
  console.log('[leve] migrations aplicadas');
  const { drizzle } = await import('drizzle-orm/expo-sqlite');
  return drizzle(sqlite, { schema }) as unknown as AppDb;
}

export async function initDb(): Promise<AppDb> {
  if (!initPromise) {
    initPromise = create().then(
      (db) => {
        instance = db;
        return db;
      },
      (e) => {
        initPromise = null;
        throw e;
      },
    );
  }
  return initPromise;
}

export const db: AppDb = new Proxy({} as AppDb, {
  get(_target, prop) {
    if (!instance) throw new Error('banco ainda não inicializado');
    const real = instance as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === 'function'
      ? (value as (...a: unknown[]) => unknown).bind(real)
      : value;
  },
});
