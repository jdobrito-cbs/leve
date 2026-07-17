import { randomBytes } from 'crypto';
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { Base64 } from 'js-base64';
import { verifyLicenseKey } from '../licenseKey';

function makeKey(priv: Uint8Array, payload: Uint8Array): string {
  const sig = ed25519.sign(payload, priv);
  const raw = new Uint8Array(72);
  raw.set(payload, 0);
  raw.set(sig, 8);
  return `LEVE-${Base64.fromUint8Array(raw, true)}`;
}

test('aceita chave assinada e devolve o id; rejeita adulteração e lixo', () => {
  const priv = new Uint8Array(randomBytes(32));
  const pub = bytesToHex(ed25519.getPublicKey(priv));
  const payload = new Uint8Array(randomBytes(8));

  const key = makeKey(priv, payload);
  expect(verifyLicenseKey(key, pub)).toBe(bytesToHex(payload));
  expect(verifyLicenseKey(` ${key} `, pub)).toBe(bytesToHex(payload)); // espaços ok

  // payload adulterado invalida a assinatura
  const tampered = new Uint8Array(payload);
  tampered[0] ^= 0xff;
  const raw = Base64.toUint8Array(key.slice(5));
  raw.set(tampered, 0);
  expect(verifyLicenseKey(`LEVE-${Base64.fromUint8Array(raw, true)}`, pub)).toBeNull();

  expect(verifyLicenseKey('LEVE-abc', pub)).toBeNull();
  expect(verifyLicenseKey('qualquer coisa', pub)).toBeNull();
  expect(verifyLicenseKey('', pub)).toBeNull();
});

test('chave gerada com outra privada não vale para a pública oficial', () => {
  const otherPriv = new Uint8Array(randomBytes(32));
  const key = makeKey(otherPriv, new Uint8Array(randomBytes(8)));
  expect(verifyLicenseKey(key)).toBeNull(); // usa a pública embutida no app
});
