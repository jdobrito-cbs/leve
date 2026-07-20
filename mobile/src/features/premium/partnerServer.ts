import type { AppDb } from '@/db/client';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { getEntitlement, setEntitlement } from './entitlement';

export function leveServerUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_LEVE_SERVER_URL;
  return url ? url.replace(/\/$/, '') : null;
}

export function isServerPartnerKey(key: string): boolean {
  return /^LEVE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key.trim().toUpperCase());
}

export function formatPartnerKeyInput(raw: string): string {
  let code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.startsWith('LEVE')) code = code.slice(4);
  code = code.slice(0, 12);
  const groups = code.match(/.{1,4}/g) ?? [];
  return groups.length ? 'LEVE-' + groups.join('-') : 'LEVE-';
}

export interface PartnerValidation {
  valid: boolean;
  label?: string;
  reason?: string;
}

const DEVICE_KEY = 'partnerDeviceId';

function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getDeviceId(db: AppDb): Promise<string> {
  const saved = await getSetting<string>(db, DEVICE_KEY);
  if (saved) return saved;
  const id = randomId();
  await setSetting(db, DEVICE_KEY, id);
  return id;
}

export async function validatePartnerKey(
  key: string,
  deviceId?: string,
): Promise<PartnerValidation | null> {
  const base = leveServerUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/partner-keys/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(deviceId ? { key: key.trim(), deviceId } : { key: key.trim() }),
    });
    if (!res.ok) return null;
    return (await res.json()) as PartnerValidation;
  } catch {
    return null;
  }
}

const RECHECK_KEY = 'partnerRecheckAt';
const RECHECK_MS = 12 * 60 * 60 * 1000;

export async function revalidatePartnerIfDue(db: AppDb): Promise<void> {
  const ent = await getEntitlement(db);
  if (ent.plan !== 'partner' || !ent.partnerKey) return;
  const last = (await getSetting<number>(db, RECHECK_KEY)) ?? 0;
  if (Date.now() - last < RECHECK_MS) return;
  const result = await validatePartnerKey(ent.partnerKey, await getDeviceId(db));
  if (result === null) return;
  await setSetting(db, RECHECK_KEY, Date.now());
  if (!result.valid) await setEntitlement(db, { plan: 'free' });
}
