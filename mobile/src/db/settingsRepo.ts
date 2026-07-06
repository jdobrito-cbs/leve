import { eq } from 'drizzle-orm';
import type { AppDb } from './client';
import { settings } from './schema';

export async function getSetting<T>(db: AppDb, key: string): Promise<T | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0] ? (JSON.parse(rows[0].value) as T) : null;
}

export async function setSetting(db: AppDb, key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  await db
    .insert(settings)
    .values({ key, value: serialized })
    .onConflictDoUpdate({ target: settings.key, set: { value: serialized } });
}
