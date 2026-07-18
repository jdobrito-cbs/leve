import { Platform } from 'react-native';
import type { AppDb } from '@/db/client';
import { getProfile, updateProfile } from '@/db/profileRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';

/**
 * Conta do usuário (Apple/Google) para o backup na nuvem dele.
 * O login registra a identidade; a gravação no iCloud/Drive vem na sequência.
 */
export interface CloudAccount {
  provider: 'apple' | 'google';
  userId: string;
  name: string | null;
  email: string | null;
  connectedAt: string;
}

const KEY = 'cloudAccount';

export async function getCloudAccount(db: AppDb): Promise<CloudAccount | null> {
  return (await getSetting<CloudAccount>(db, KEY)) ?? null;
}

export function isAppleSignInSupported(): boolean {
  return Platform.OS === 'ios';
}

/** null quando o usuário cancela; lança erro quando o login não está disponível. */
export async function signInWithApple(db: AppDb): Promise<CloudAccount | null> {
  const Apple = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
  if (!(await Apple.isAvailableAsync())) throw new Error('apple-unavailable');
  try {
    const credential = await Apple.signInAsync({
      requestedScopes: [
        Apple.AppleAuthenticationScope.FULL_NAME,
        Apple.AppleAuthenticationScope.EMAIL,
      ],
    });
    const fullName =
      [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ') || null;
    // A Apple envia nome/e-mail apenas na PRIMEIRA autorização do Apple ID;
    // nos logins seguintes vêm nulos — preserva o que já foi salvo.
    const prev = await getCloudAccount(db);
    const samePrev = prev?.provider === 'apple' && prev.userId === credential.user;
    const account: CloudAccount = {
      provider: 'apple',
      userId: credential.user,
      name: fullName ?? (samePrev ? prev.name : null),
      email: credential.email ?? (samePrev ? prev.email : null),
      connectedAt: new Date().toISOString(),
    };
    await setSetting(db, KEY, account);
    // A conta preenche o nome do perfil quando ele ainda está vazio.
    if (account.name) {
      const profile = await getProfile(db);
      if (!profile?.name) await updateProfile(db, { name: account.name });
    }
    return account;
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}
