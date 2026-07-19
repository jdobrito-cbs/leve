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
  /** 'bound_elsewhere' quando a chave já está presa a outro aparelho. */
  reason?: string;
}

const DEVICE_KEY = 'partnerDeviceId';

/** Id de instalação (não é dado de hardware): só precisa ser único por aparelho
 *  e estável. Gerado uma vez e guardado localmente. */
function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Devolve o id deste aparelho, criando e salvando na primeira vez. */
export async function getDeviceId(db: AppDb): Promise<string> {
  const saved = await getSetting<string>(db, DEVICE_KEY);
  if (saved) return saved;
  const id = randomId();
  await setSetting(db, DEVICE_KEY, id);
  return id;
}

/** null = não deu para falar com o servidor (sem rede, servidor fora do ar).
 *  Com deviceId, o servidor prende a chave a este aparelho no primeiro uso. */
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

/** Reconfere a chave de parceiro no servidor (no máximo a cada 12 h).
 *  Sem rede mantém o acesso; revogada → volta ao plano gratuito. */
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
