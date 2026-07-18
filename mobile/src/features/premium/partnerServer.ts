import type { AppDb } from '@/db/client';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { getEntitlement, setEntitlement } from './entitlement';

/**
 * Chaves de parceiro emitidas pelo SERVIDOR (curtas, LEVE-XXXX-XXXX-XXXX).
 * O servidor é a autoridade: valida no resgate e reconfere periodicamente —
 * revogar no painel derruba o acesso na próxima verificação do aparelho.
 */

/** Base do servidor do Leve (validação de parceiros e scan de comida). */
export function leveServerUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_LEVE_SERVER_URL;
  return url ? url.replace(/\/$/, '') : null;
}

export function isServerPartnerKey(key: string): boolean {
  return /^LEVE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key.trim().toUpperCase());
}

export interface PartnerValidation {
  valid: boolean;
  label?: string;
}

/** null = não deu para falar com o servidor (sem rede, servidor fora do ar). */
export async function validatePartnerKey(key: string): Promise<PartnerValidation | null> {
  const base = leveServerUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/partner-keys/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: key.trim() }),
    });
    if (!res.ok) return null;
    return (await res.json()) as PartnerValidation;
  } catch {
    return null;
  }
}

const RECHECK_KEY = 'partnerRecheckAt';
const RECHECK_MS = 12 * 60 * 60 * 1000;

/** Reconfere a chave de parceiro no servidor (no máximo a cada 12 h).
 *  Sem rede mantém o acesso; revogada → volta ao plano gratuito. */
export async function revalidatePartnerIfDue(db: AppDb): Promise<void> {
  const ent = await getEntitlement(db);
  if (ent.plan !== 'partner' || !ent.partnerKey) return;
  const last = (await getSetting<number>(db, RECHECK_KEY)) ?? 0;
  if (Date.now() - last < RECHECK_MS) return;
  const result = await validatePartnerKey(ent.partnerKey);
  if (result === null) return;
  await setSetting(db, RECHECK_KEY, Date.now());
  if (!result.valid) await setEntitlement(db, { plan: 'free' });
}
