import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import jwt from 'jsonwebtoken';
import qrcode from 'qrcode-generator';
import type { AdminRecord, AdminRole } from './store.js';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of clean) {
    value = (value << 5) | B32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number, digits: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const h = createHmac('sha1', secret).update(buf).digest();
  const offset = h[h.length - 1] & 0x0f;
  const bin =
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff);
  return (bin % 10 ** digits).toString().padStart(digits, '0');
}

export function totpAt(secretBase32: string, timeMs: number, digits = 6, stepSec = 30): string {
  const counter = Math.floor(timeMs / 1000 / stepSec);
  return hotp(base32Decode(secretBase32), counter, digits);
}

export function verifyTotp(
  secretBase32: string,
  token: string,
  timeMs: number = Date.now(),
  window = 1,
): boolean {
  const t = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(t)) return false;
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(timeMs / 1000 / 30);
  for (let w = -window; w <= window; w++) {
    const candidate = hotp(secret, counter + w, 6);
    if (timingSafeEqual(Buffer.from(candidate), Buffer.from(t))) return true;
  }
  return false;
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function otpauthUrl(secretBase32: string, account: string, issuer = 'Leve'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function qrDataUrl(text: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createDataURL(4, 8);
}

const BACKUP_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateBackupCodes(count = 8): string[] {
  const pick = () => BACKUP_ALPHABET[randomBytes(1)[0] % BACKUP_ALPHABET.length];
  const group = () => Array.from({ length: 4 }, pick).join('');
  return Array.from({ length: count }, () => `${group()}-${group()}`);
}

export function hashBackupCode(code: string): string {
  const norm = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return createHash('sha256').update(norm).digest('hex');
}

export function adminEncKey(adminToken: string): Buffer {
  return scryptSync(adminToken, 'leve-admin-enc-v1', 32);
}

export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString('base64')).join(':');
}

export function decryptSecret(enc: string, key: Buffer): string | null {
  try {
    const [ivb, tagb, ctb] = enc.split(':').map((s) => Buffer.from(s, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', key, ivb);
    decipher.setAuthTag(tagb);
    return Buffer.concat([decipher.update(ctb), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export type AdminScope = 'full' | 'enroll';
export interface AdminSession {
  sub: string;
  role: AdminRole;
  ver: number;
  scope: AdminScope;
}

export const ADMIN_COOKIE = 'leve_admin';
export const MAX_FAILED = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const FULL_TTL_SEC = 12 * 60 * 60;
export const ENROLL_TTL_SEC = 15 * 60;

export function adminSessionSecret(adminToken: string): string {
  return createHash('sha256').update('leve-admin-session-v1|' + adminToken).digest('hex');
}

export function signAdminSession(
  admin: AdminRecord,
  scope: AdminScope,
  secret: string,
  ttlSec: number = scope === 'full' ? FULL_TTL_SEC : ENROLL_TTL_SEC,
): string {
  return jwt.sign({ role: admin.role, ver: admin.tokenVersion, scope }, secret, {
    subject: admin.id,
    expiresIn: ttlSec,
  });
}

export function verifyAdminSession(token: string, secret: string): AdminSession | null {
  try {
    const p = jwt.verify(token, secret);
    if (typeof p !== 'object' || p === null) return null;
    const { sub, role, ver, scope } = p as Record<string, unknown>;
    if (typeof sub !== 'string') return null;
    if (role !== 'master' && role !== 'admin') return null;
    if (typeof ver !== 'number') return null;
    if (scope !== 'full' && scope !== 'enroll') return null;
    return { sub, role, ver, scope };
  } catch {
    return null;
  }
}

export function serializeSessionCookie(value: string, maxAgeSec: number, secure = true): string {
  const parts = [
    `${ADMIN_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSec}`,
  ];
  if (secure) parts.splice(2, 0, 'Secure');
  return parts.join('; ');
}

export function clearSessionCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function readSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === ADMIN_COOKIE) return part.slice(eq + 1).trim();
  }
  return null;
}

export function canCreateAdmin(actor: { role: AdminRole }): boolean {
  return actor.role === 'master';
}

export function canDeleteAdmin(actor: AdminRecord, target: AdminRecord): boolean {
  return actor.role === 'master' && target.role !== 'master';
}

export function canChangePassword(actor: AdminRecord, target: AdminRecord): boolean {
  if (target.role === 'master') return actor.id === target.id;
  return true;
}

export function canResetTotp(actor: AdminRecord, target: AdminRecord): boolean {
  return actor.role === 'master' && actor.id !== target.id;
}
