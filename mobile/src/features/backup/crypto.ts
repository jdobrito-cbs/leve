import { gcm } from '@noble/ciphers/aes.js';
import { bytesToUtf8, utf8ToBytes } from '@noble/ciphers/utils.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import * as Crypto from 'expo-crypto';
import { Base64 } from 'js-base64';

export function deriveBackupKey(password: string, email: string): Uint8Array {
  return scrypt(utf8ToBytes(password), utf8ToBytes(`leve:${email.toLowerCase().trim()}`), {
    N: 2 ** 15,
    r: 8,
    p: 1,
    dkLen: 32,
  });
}

export function encryptBackup(plaintext: string, key: Uint8Array): string {
  const nonce = Crypto.getRandomBytes(12);
  const ciphertext = gcm(key, nonce).encrypt(utf8ToBytes(plaintext));
  return `v1.${Base64.fromUint8Array(nonce)}.${Base64.fromUint8Array(ciphertext)}`;
}

export function decryptBackup(payload: string, key: Uint8Array): string {
  const [version, nonce, ciphertext] = payload.split('.');
  if (version !== 'v1' || !nonce || !ciphertext) {
    throw new Error('formato de backup desconhecido');
  }
  const plain = gcm(key, Base64.toUint8Array(nonce)).decrypt(Base64.toUint8Array(ciphertext));
  return bytesToUtf8(plain);
}
