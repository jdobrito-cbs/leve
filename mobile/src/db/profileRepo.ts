import { eq } from 'drizzle-orm';
import type { Profile } from '@/core/types';
import type { AppDb } from './client';
import { profile } from './schema';

export async function getProfile(db: AppDb): Promise<Profile | null> {
  const rows = await db.select().from(profile).limit(1);
  return rows[0] ?? null;
}

export async function acceptDisclaimer(db: AppDb, now: Date): Promise<void> {
  const existing = await getProfile(db);
  const acceptedAt = now.toISOString();
  if (existing) {
    await db.update(profile).set({ disclaimerAcceptedAt: acceptedAt }).where(eq(profile.id, existing.id));
  } else {
    await db.insert(profile).values({ disclaimerAcceptedAt: acceptedAt });
  }
}
