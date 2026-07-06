import { strings } from '@/i18n/pt-BR';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_SCAN_URL;

export function isAccountConfigured(): boolean {
  return Boolean(BASE);
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthError extends Error {}

async function call<T>(
  path: string,
  options: { method: string; token?: string; body?: unknown },
): Promise<T> {
  if (!BASE) throw new Error(strings.account.offline);
  let res: Response;
  try {
    res = await fetch(`${BASE.replace(/\/$/, '')}${path}`, {
      method: options.method,
      headers: {
        'content-type': 'application/json',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error(strings.account.genericError);
  }
  if (res.status === 401) throw new AuthError('não autenticado');
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(json.error ?? strings.account.genericError);
  return json;
}

export const api = {
  register: (email: string, password: string, backupConsent: boolean) =>
    call<TokenPair>('/auth/register', {
      method: 'POST',
      body: { email, password, consents: { terms: true, backup: backupConsent } },
    }),
  login: (email: string, password: string) =>
    call<TokenPair>('/auth/login', { method: 'POST', body: { email, password } }),
  refresh: (refreshToken: string) =>
    call<TokenPair>('/auth/refresh', { method: 'POST', body: { refreshToken } }),
  logout: (refreshToken: string) =>
    call<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
  putBackup: (token: string, blob: string) =>
    call<{ ok: boolean }>('/backup', { method: 'PUT', token, body: { blob } }),
  getBackup: (token: string) =>
    call<{ blob: string; updatedAt: string }>('/backup', { method: 'GET', token }),
  deleteAccount: (token: string, password: string) =>
    call<void>('/account', { method: 'DELETE', token, body: { password } }),
};
