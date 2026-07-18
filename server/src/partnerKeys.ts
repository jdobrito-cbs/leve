import { createHash, randomBytes } from 'node:crypto';

/**
 * Chaves de parceiro emitidas PELO SERVIDOR (revogáveis pelo painel).
 * Formato curto e ditável: LEVE-XXXX-XXXX-XXXX. O servidor guarda só o hash;
 * o código completo aparece uma única vez, na criação.
 */

// Sem 0/O/1/I/L para não confundir na leitura em voz alta.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generatePartnerKey(): string {
  const pick = () => ALPHABET[randomBytes(1)[0] % ALPHABET.length];
  const group = () => Array.from({ length: 4 }, pick).join('');
  return `LEVE-${group()}-${group()}-${group()}`;
}

export function normalizePartnerKey(key: string): string {
  return key.trim().toUpperCase();
}

export function isPartnerKeyFormat(key: string): boolean {
  return /^LEVE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizePartnerKey(key));
}

export function hashPartnerKey(key: string): string {
  return createHash('sha256').update(normalizePartnerKey(key)).digest('hex');
}

/** Últimos 4 caracteres, para identificar a chave na lista sem expor o código. */
export function partnerKeyHint(key: string): string {
  return normalizePartnerKey(key).slice(-4);
}
