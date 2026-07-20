import { createHash, randomBytes } from 'node:crypto';

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

export function partnerKeyHint(key: string): string {
  return normalizePartnerKey(key).slice(-4);
}
