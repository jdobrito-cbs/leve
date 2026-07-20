import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { Base64 } from 'js-base64';

export const LICENSE_PUBLIC_KEY_HEX =
  '98473d817ffe35b42755cc6deac77c94322f0b67d7d6fbd68d078ddf426e5f04';

export function verifyLicenseKey(
  key: string,
  publicKeyHex: string = LICENSE_PUBLIC_KEY_HEX,
): string | null {
  const match = /^LEVE-([A-Za-z0-9_-]+)$/.exec(key.trim());
  if (!match) return null;
  try {
    const raw = Base64.toUint8Array(match[1]);
    if (raw.length !== 72) return null;
    const payload = raw.slice(0, 8);
    const signature = raw.slice(8);
    return ed25519.verify(signature, payload, hexToBytes(publicKeyHex))
      ? bytesToHex(payload)
      : null;
  } catch {
    return null;
  }
}
