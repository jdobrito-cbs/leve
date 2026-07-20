import type { AppDb } from '@/db/client';
import { getSetting, setSetting } from '@/db/settingsRepo';

export type PlanKind = 'free' | 'monthly' | 'annual' | 'partner';

export interface Entitlement {
  plan: PlanKind;
  activatedAt?: string;
  licenseId?: string;
  partnerKey?: string;
}

const KEY = 'entitlement';
const FREE: Entitlement = { plan: 'free' };

export async function getEntitlement(db: AppDb): Promise<Entitlement> {
  return (await getSetting<Entitlement>(db, KEY)) ?? FREE;
}

export async function setEntitlement(db: AppDb, ent: Entitlement): Promise<void> {
  await setSetting(db, KEY, ent);
}

export function isPremium(ent: Entitlement): boolean {
  return ent.plan !== 'free';
}
