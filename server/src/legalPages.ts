/**
 * Renderiza os documentos legais (aviso médico, termos, política) como páginas
 * públicas na web — a App Store e a Play Store exigem a política de privacidade
 * numa URL pública. Conteúdo gerado da fonte do app (legalContent.ts).
 */
import { medicalNotice, privacyPolicy, termsOfUse, type LegalDoc } from './legalContent.js';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLegalDoc(doc: LegalDoc): string {
  const sections = doc.sections
    .map((s) => {
      const heading = s.heading ? `<h2>${esc(s.heading)}</h2>` : '';
      const paras = s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n');
      return `<section>${heading}${paras}</section>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(doc.title)} · Leve</title>
<link rel="icon" type="image/png" href="/favicon.png"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<style>
  :root { --blue:#2563EB; --ink:#0F172A; --muted:#64748B; --line:#E2E8F0; --bg:#FFFFFF; }
  @media (prefers-color-scheme: dark) {
    :root { --ink:#E7EDF7; --muted:#93A3BC; --line:#24304A; --bg:#0B1120; --blue:#60A5FA; }
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--bg); color:var(--ink);
    font:16px/1.65 -apple-system,"Segoe UI",Roboto,sans-serif; padding:0 20px; }
  .wrap { max-width:760px; margin:0 auto; padding:48px 0 80px; }
  .brand { display:flex; align-items:center; gap:10px; margin-bottom:28px; }
  .brand b { font-size:19px; } .brand a { color:var(--blue); text-decoration:none; }
  h1 { font-size:28px; line-height:1.2; text-wrap:balance; }
  .upd { color:var(--muted); font-size:14px; margin:8px 0 28px; }
  section { margin:22px 0; }
  h2 { font-size:18px; margin-bottom:8px; text-wrap:balance; }
  p { color:var(--ink); margin:8px 0; }
  footer { border-top:1px solid var(--line); margin-top:36px; padding-top:20px;
    color:var(--muted); font-size:13px; display:grid; gap:4px; }
  footer a { color:var(--blue); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="8" fill="#2563EB"/>
        <g transform="translate(6 6) scale(0.92)" fill="none" stroke="#fff" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
          <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/>
        </g>
      </svg>
      <b><a href="/">Leve</a></b>
    </div>
    <h1>${esc(doc.title)}</h1>
    <div class="upd">${esc(doc.updated)}</div>
    ${sections}
    <footer>
      <div>© 2026 Jorge Brito e Jorge Manoel Reis Brito · Leve</div>
      <div><a href="/privacidade">Política de privacidade</a> · <a href="/termos">Termos de uso</a> · <a href="/aviso-medico">Aviso médico</a></div>
      <div><a href="mailto:jdobrito@gmail.com">jdobrito@gmail.com</a></div>
    </footer>
  </div>
</body>
</html>`;
}

export const PRIVACY_PAGE_HTML = renderLegalDoc(privacyPolicy);
export const TERMS_PAGE_HTML = renderLegalDoc(termsOfUse);
export const MEDICAL_PAGE_HTML = renderLegalDoc(medicalNotice);
