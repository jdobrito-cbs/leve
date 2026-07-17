// Gera chaves de desbloqueio definitivo para parceiros e amigos.
//
// Uso:
//   node scripts/gen-license.mjs           → gera 1 chave
//   node scripts/gen-license.mjs 5         → gera 5 chaves
//
// A chave privada fica em scripts/license-key.private.json (fora do Git).
// Guarde uma cópia segura dela: sem a privada não é possível emitir novas
// chaves, e quem tiver a privada consegue emitir chaves válidas.
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ed25519 } from '@noble/curves/ed25519.js';
import { hexToBytes } from '@noble/hashes/utils.js';

const here = dirname(fileURLToPath(import.meta.url));
const keyFile = join(here, 'license-key.private.json');

let priv;
try {
  priv = hexToBytes(JSON.parse(readFileSync(keyFile, 'utf8')).privateKeyHex);
} catch {
  console.error('Chave privada não encontrada em', keyFile);
  process.exit(1);
}

function toBase64Url(bytes) {
  return Buffer.from(bytes)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

const count = Math.max(1, Number(process.argv[2] ?? 1));
for (let i = 0; i < count; i++) {
  const payload = randomBytes(8);
  const sig = ed25519.sign(payload, priv);
  const raw = new Uint8Array(72);
  raw.set(payload, 0);
  raw.set(sig, 8);
  console.log(`LEVE-${toBase64Url(raw)}  (id ${Buffer.from(payload).toString('hex')})`);
}
