import * as SecureStore from 'expo-secure-store';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db/client';
import { exportAllData, importAllData } from '@/features/backup/exportData';
import { decryptBackup, deriveBackupKey, encryptBackup } from '@/features/backup/crypto';
import { AuthError, api } from '@/services/api/client';

const KEYS = {
  email: 'leve.email',
  access: 'leve.access',
  refresh: 'leve.refresh',
  backupKey: 'leve.backupKey',
};

async function clearSession() {
  await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
}

async function saveSession(email: string, tokens: { accessToken: string; refreshToken: string }, keyHex?: string) {
  await SecureStore.setItemAsync(KEYS.email, email);
  await SecureStore.setItemAsync(KEYS.access, tokens.accessToken);
  await SecureStore.setItemAsync(KEYS.refresh, tokens.refreshToken);
  if (keyHex) await SecureStore.setItemAsync(KEYS.backupKey, keyHex);
}

/** Executa uma chamada autenticada; em 401 tenta uma rotação de refresh e repete uma vez. */
async function withAuth<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const access = await SecureStore.getItemAsync(KEYS.access);
  if (!access) throw new AuthError('sem sessão');
  try {
    return await fn(access);
  } catch (e) {
    if (!(e instanceof AuthError)) throw e;
    const refresh = await SecureStore.getItemAsync(KEYS.refresh);
    if (!refresh) throw e;
    const tokens = await api.refresh(refresh);
    await SecureStore.setItemAsync(KEYS.access, tokens.accessToken);
    await SecureStore.setItemAsync(KEYS.refresh, tokens.refreshToken);
    return fn(tokens.accessToken);
  }
}

export function useAccount() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(KEYS.email)
      .then(setEmail)
      .catch(() => setEmail(null)) // web: cofre indisponível — segue deslogado
      .finally(() => setLoading(false));
  }, []);

  const run = useCallback(async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setNotice(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const register = useCallback(
    (mail: string, password: string, backupConsent: boolean) =>
      run(async () => {
        const tokens = await api.register(mail.trim().toLowerCase(), password, backupConsent);
        await saveSession(mail.trim().toLowerCase(), tokens, bytesToHex(deriveBackupKey(password, mail)));
        setEmail(mail.trim().toLowerCase());
        return null;
      }),
    [run],
  );

  const login = useCallback(
    (mail: string, password: string) =>
      run(async () => {
        const tokens = await api.login(mail.trim().toLowerCase(), password);
        await saveSession(mail.trim().toLowerCase(), tokens, bytesToHex(deriveBackupKey(password, mail)));
        setEmail(mail.trim().toLowerCase());
        return null;
      }),
    [run],
  );

  const logout = useCallback(
    () =>
      run(async () => {
        const refresh = await SecureStore.getItemAsync(KEYS.refresh);
        if (refresh) await api.logout(refresh).catch(() => undefined);
        await clearSession();
        setEmail(null);
        return null;
      }),
    [run],
  );

  const backupNow = useCallback(
    (doneMessage: string) =>
      run(async () => {
        const keyHex = await SecureStore.getItemAsync(KEYS.backupKey);
        if (!keyHex) throw new AuthError('sem chave');
        const data = await exportAllData(db);
        const payload = encryptBackup(JSON.stringify(data), hexToBytes(keyHex));
        await withAuth((t) => api.putBackup(t, payload));
        return doneMessage;
      }),
    [run],
  );

  const restore = useCallback(
    (doneMessage: string) =>
      run(async () => {
        const keyHex = await SecureStore.getItemAsync(KEYS.backupKey);
        if (!keyHex) throw new AuthError('sem chave');
        const { blob } = await withAuth((t) => api.getBackup(t));
        const json = decryptBackup(blob, hexToBytes(keyHex));
        await importAllData(db, JSON.parse(json));
        return doneMessage;
      }),
    [run],
  );

  const deleteAccount = useCallback(
    (password: string) =>
      run(async () => {
        await withAuth((t) => api.deleteAccount(t, password));
        await clearSession();
        setEmail(null);
        return null;
      }),
    [run],
  );

  return { loading, email, busy, error, notice, register, login, logout, backupNow, restore, deleteAccount };
}
