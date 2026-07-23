import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const stage = join(root, 'deploy', 'stage');
const out = join(root, 'deploy', 'leve-server.zip');

rmSync(join(root, 'deploy'), { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

const items = [
  'app.md',
  'setup.sh',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'prisma',
  'src',
];
for (const item of items) {
  cpSync(join(root, item), join(stage, item), { recursive: true });
}

const stageSrc = join(stage, 'src');
for (const f of readdirSync(stageSrc)) {
  if (f.endsWith('.test.ts')) rmSync(join(stageSrc, f));
}

for (const name of ['setup.sh', 'app.md']) {
  const p = join(stage, name);
  writeFileSync(p, readFileSync(p, 'utf8').replace(/\r\n/g, '\n'));
}

execFileSync('tar', ['-a', '-cf', out, '-C', stage, ...items], { stdio: 'inherit' });
rmSync(stage, { recursive: true, force: true });

const size = (statSync(out).size / 1024).toFixed(0);
console.log(`zip gerado: ${out} (${size} KB)`);
console.log('conteúdo:');
execFileSync('tar', ['-tf', out], { stdio: 'inherit' });
