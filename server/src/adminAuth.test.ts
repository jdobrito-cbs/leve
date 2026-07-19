import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  adminEncKey,
  adminSessionSecret,
  base32Decode,
  base32Encode,
  canChangePassword,
  canCreateAdmin,
  canDeleteAdmin,
  canResetTotp,
  decryptSecret,
  encryptSecret,
  generateBackupCodes,
  hashBackupCode,
  readSessionCookie,
  signAdminSession,
  totpAt,
  verifyAdminSession,
  verifyTotp,
} from './adminAuth.js';
import type { AdminRecord, AdminRole } from './store.js';

const mk = (id: string, role: AdminRole): AdminRecord => ({
  id,
  username: id,
  role,
  passwordHash: '',
  totpSecretEnc: null,
  totpEnabled: true,
  backupCodeHashes: [],
  tokenVersion: 0,
  failedAttempts: 0,
  lockedUntil: null,
  createdAt: '',
});

describe('base32', () => {
  it('vai e volta para bytes aleatórios', () => {
    const buf = randomBytes(20);
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
  });
  it('codifica o vetor conhecido do RFC 4648', () => {
    expect(base32Encode(Buffer.from('12345678901234567890'))).toBe(
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
    );
  });
});

describe('TOTP (RFC 6238)', () => {
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  it('bate com os vetores oficiais em T=59s', () => {
    expect(totpAt(secret, 59_000, 8)).toBe('94287082');
    expect(totpAt(secret, 59_000, 6)).toBe('287082');
  });
  it('verifica o código certo e recusa o errado', () => {
    expect(verifyTotp(secret, '287082', 59_000)).toBe(true);
    expect(verifyTotp(secret, '000000', 59_000)).toBe(false);
    expect(verifyTotp(secret, 'abc', 59_000)).toBe(false);
  });
  it('aceita a janela de ±1 passo', () => {
    // Código do passo anterior ainda vale (relógio levemente atrasado).
    const prev = totpAt(secret, 29_000, 6);
    expect(verifyTotp(secret, prev, 59_000)).toBe(true);
  });
});

describe('códigos de backup', () => {
  it('gera 8 códigos no formato XXXX-XXXX e o hash normaliza caixa/hífen', () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(8);
    expect(codes[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(hashBackupCode('ab2c-d3ef')).toBe(hashBackupCode('AB2CD3EF'));
  });
});

describe('cifra do segredo TOTP', () => {
  it('vai e volta com a chave certa e falha com a errada', () => {
    const key = adminEncKey('token-do-servidor-bem-longo');
    const enc = encryptSecret('MEUSEGREDO', key);
    expect(decryptSecret(enc, key)).toBe('MEUSEGREDO');
    const other = adminEncKey('outro-token-completamente');
    expect(decryptSecret(enc, other)).toBeNull();
  });
});

describe('sessão em cookie assinado', () => {
  const secret = adminSessionSecret('token-do-servidor-bem-longo');
  it('assina e verifica; recusa adulteração e segredo errado', () => {
    const token = signAdminSession(mk('a1', 'admin'), 'full', secret);
    const s = verifyAdminSession(token, secret);
    expect(s).toMatchObject({ sub: 'a1', role: 'admin', ver: 0, scope: 'full' });
    expect(verifyAdminSession(token + 'x', secret)).toBeNull();
    expect(verifyAdminSession(token, adminSessionSecret('outro'))).toBeNull();
  });
  it('lê o cookie do cabeçalho', () => {
    expect(readSessionCookie('a=1; leve_admin=abc.def; b=2')).toBe('abc.def');
    expect(readSessionCookie(undefined)).toBeNull();
    expect(readSessionCookie('outro=1')).toBeNull();
  });
});

describe('matriz de permissões', () => {
  const master = mk('m', 'master');
  const a1 = mk('a1', 'admin');
  const a2 = mk('a2', 'admin');

  it('só o master cria', () => {
    expect(canCreateAdmin(master)).toBe(true);
    expect(canCreateAdmin(a1)).toBe(false);
  });
  it('só o master exclui, e nunca o master', () => {
    expect(canDeleteAdmin(master, a1)).toBe(true);
    expect(canDeleteAdmin(master, master)).toBe(false);
    expect(canDeleteAdmin(a1, a2)).toBe(false);
  });
  it('senha do master só o próprio; a de comum qualquer admin', () => {
    expect(canChangePassword(master, master)).toBe(true);
    expect(canChangePassword(a1, master)).toBe(false);
    expect(canChangePassword(master, a1)).toBe(true);
    expect(canChangePassword(a1, a2)).toBe(true);
    expect(canChangePassword(a1, a1)).toBe(true);
  });
  it('reset de 2FA de terceiros só o master, nunca em si', () => {
    expect(canResetTotp(master, a1)).toBe(true);
    expect(canResetTotp(master, master)).toBe(false);
    expect(canResetTotp(a1, a2)).toBe(false);
  });
});
