// Gera os ícones e o splash do Leve (broto branco sobre gradiente azul).
// Uso: node scripts/build-icons.mjs   (requer devDependency sharp)
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = fileURLToPath(new URL('../assets/images/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const SPROUT = `
  <g fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
    <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/>
    <path d="M5 21h14"/>
  </g>`;

const GRADIENT = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#60A5FA"/>
    </linearGradient>
  </defs>`;

// glyphScale = fração do canvas ocupada pelo broto
function svg({ size, background, glyph = true, glyphScale = 0.56 }) {
  const glyphSize = size * glyphScale;
  const offset = (size - glyphSize) / 2;
  const scale = glyphSize / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    ${GRADIENT}
    ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
    ${glyph ? `<g transform="translate(${offset} ${offset}) scale(${scale})">${SPROUT}</g>` : ''}
  </svg>`;
}

const jobs = [
  // iOS/geral: quadrado cheio com gradiente
  { file: 'icon.png', size: 1024, background: 'url(#g)', glyphScale: 0.56 },
  // Android adaptive: fundo gradiente + broto menor (zona segura)
  { file: 'android-icon-background.png', size: 1024, background: 'url(#g)', glyph: false },
  { file: 'android-icon-foreground.png', size: 1024, background: null, glyphScale: 0.4 },
  { file: 'android-icon-monochrome.png', size: 1024, background: null, glyphScale: 0.4 },
  // Splash e favicon
  { file: 'splash-icon.png', size: 512, background: null, glyphScale: 0.9 },
  { file: 'favicon.png', size: 48, background: 'url(#g)', glyphScale: 0.6 },
];

for (const job of jobs) {
  await sharp(Buffer.from(svg(job))).png().toFile(`${OUT}${job.file}`);
  console.log(`${job.file} ok`);
}
