// Gera server/src/legalContent.ts a partir da fonte do app (pt-BR), para as
// páginas públicas /privacidade, /termos e /aviso-medico. O app é a fonte da
// verdade; rode este script se o texto legal mudar lá.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { medicalNotice, privacyPolicy, termsOfUse } from '../../mobile/src/i18n/legal-pt-BR.ts';

const out =
  '// GERADO de mobile/src/i18n/legal-pt-BR.ts — não editar à mão (rode scripts/gen-legal.mts).\n' +
  'export interface LegalSection { heading?: string; paragraphs: string[] }\n' +
  'export interface LegalDoc { title: string; updated: string; sections: LegalSection[] }\n\n' +
  `export const medicalNotice: LegalDoc = ${JSON.stringify(medicalNotice, null, 2)};\n\n` +
  `export const termsOfUse: LegalDoc = ${JSON.stringify(termsOfUse, null, 2)};\n\n` +
  `export const privacyPolicy: LegalDoc = ${JSON.stringify(privacyPolicy, null, 2)};\n`;

writeFileSync(fileURLToPath(new URL('../src/legalContent.ts', import.meta.url)), out, 'utf8');
console.log('legalContent.ts gerado');
