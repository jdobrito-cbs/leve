/**
 * Site do Leve — página única (one-pager) servida na raiz do domínio
 * (www.levemobile.com.br). Sem dependências externas: SVG e CSS inline,
 * modo claro/escuro, responsivo. Identidade do app (azul #2563EB, broto).
 * Conteúdo alinhado ao design responsável: o Leve registra e organiza, não
 * trata nem aconselha dose.
 */

export const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Leve — Seu diário de saúde</title>
<meta name="description" content="O Leve organiza seu dia a dia de saúde no tratamento GLP-1: água, refeições com a tabela TACO, peso, doses e saúde do relógio — em 12 idiomas, com tudo guardado no seu aparelho."/>
<meta property="og:title" content="Leve — Seu diário de saúde"/>
<meta property="og:description" content="Diário para tratamento GLP-1: água, refeições, peso, doses e saúde conectada. Privado por padrão."/>
<meta property="og:type" content="website"/>
<style>
  :root {
    --blue:#2563EB; --blue-2:#60A5FA; --blue-ink:#1D4ED8;
    --green:#15803D; --green-soft:#E7F6EC;
    --ink:#0E1B2E; --muted:#566178; --line:#E3EAF5; --bg:#FFFFFF; --panel:#F6F9FF;
    --hero-1:#2563EB; --hero-2:#4F86F7; --on-hero:#FFFFFF;
  }
  @media (prefers-color-scheme: dark) {
    :root { --ink:#E9EFFA; --muted:#98A6C0; --line:#213049; --bg:#0A1120; --panel:#111C2E;
      --blue:#5E93F5; --blue-2:#7CA7F5; --green:#5BD08A; --green-soft:#12281B;
      --hero-1:#12245A; --hero-2:#1B2E63; }
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { background:var(--bg); color:var(--ink);
    font:16px/1.65 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased; }
  a { color:inherit; text-decoration:none; }
  .wrap { max-width:1080px; margin:0 auto; padding:0 22px; }
  h1,h2,h3 { text-wrap:balance; line-height:1.12; letter-spacing:-0.02em; }

  /* Nav */
  nav { position:sticky; top:0; z-index:20; backdrop-filter:saturate(1.4) blur(10px);
    background:color-mix(in srgb, var(--bg) 82%, transparent); border-bottom:1px solid var(--line); }
  nav .wrap { display:flex; align-items:center; gap:18px; height:62px; }
  .brand { display:flex; align-items:center; gap:9px; font-weight:800; font-size:19px; letter-spacing:-0.01em; }
  .brand .mark { width:30px; height:30px; border-radius:8px; display:block; }
  nav .links { margin-left:auto; display:flex; gap:22px; align-items:center; }
  nav .links a { color:var(--muted); font-size:14.5px; font-weight:600; }
  nav .links a:hover { color:var(--ink); }
  nav .cta { background:var(--blue); color:#fff; padding:8px 15px; border-radius:10px; font-weight:700; font-size:14px; }
  @media (max-width:720px){ nav .links a.hideMob { display:none; } }

  /* Hero */
  .hero { background:linear-gradient(158deg, var(--hero-1), var(--hero-2)); color:var(--on-hero); overflow:hidden; }
  .hero .wrap { display:grid; grid-template-columns:1.15fr 0.85fr; gap:38px; align-items:center;
    padding:70px 22px 76px; }
  .hero h1 { font-size:clamp(32px,5vw,52px); font-weight:800; max-width:16ch; }
  .hero p.sub { margin-top:18px; font-size:clamp(16px,2vw,19px); opacity:.94; max-width:46ch; }
  .soon { display:inline-flex; align-items:center; gap:8px; margin-top:28px;
    background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.5); border-radius:999px;
    padding:9px 18px; font-weight:600; font-size:14.5px; }
  .soon .dot { width:8px; height:8px; border-radius:50%; background:#7EE2A8; box-shadow:0 0 0 4px rgba(126,226,168,.28); }
  .trust { margin-top:22px; display:flex; flex-wrap:wrap; gap:8px 20px; font-size:13.5px; opacity:.9; }
  .trust span { display:inline-flex; align-items:center; gap:7px; }
  .phone-col { display:flex; justify-content:center; }

  /* Sections */
  section.pad { padding:72px 0; }
  .eyebrow { color:var(--blue); font-weight:800; text-transform:uppercase; letter-spacing:.14em; font-size:12px; }
  .sec-h { font-size:clamp(24px,3.4vw,34px); font-weight:800; margin:8px 0 6px; }
  .sec-lead { color:var(--muted); max-width:60ch; font-size:17px; }

  .features { margin-top:34px; display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:18px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:22px; display:grid; gap:9px; align-content:start; }
  .card .ic { width:44px; height:44px; border-radius:13px; background:var(--bg); border:1px solid var(--line);
    display:grid; place-items:center; color:var(--blue); }
  .card h3 { font-size:17.5px; font-weight:700; }
  .card p { color:var(--muted); font-size:14.5px; }

  .steps { margin-top:34px; display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:20px; counter-reset:st; }
  .step { position:relative; padding-top:6px; }
  .step .n { width:38px; height:38px; border-radius:11px; background:var(--blue); color:#fff; font-weight:800;
    display:grid; place-items:center; font-size:17px; margin-bottom:12px; }
  .step h3 { font-size:17.5px; font-weight:700; margin-bottom:5px; }
  .step p { color:var(--muted); font-size:14.5px; }

  .privacy { background:var(--green-soft); }
  .privacy .wrap { display:grid; grid-template-columns:auto 1fr; gap:22px; align-items:center; padding:44px 22px; }
  .privacy .shield { width:56px; height:56px; color:var(--green); }
  .privacy h2 { font-size:clamp(22px,3vw,30px); font-weight:800; color:var(--green); }
  .privacy p { color:var(--ink); max-width:70ch; margin-top:8px; font-size:16px; }

  /* Pricing */
  .plans { margin-top:34px; display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; max-width:760px; }
  .plan { background:var(--panel); border:1px solid var(--line); border-radius:20px; padding:26px; display:grid; gap:12px; align-content:start; }
  .plan.best { border-color:var(--blue); box-shadow:0 12px 40px -18px color-mix(in srgb,var(--blue) 60%,transparent); }
  .plan .tag { justify-self:start; font-size:12px; font-weight:800; letter-spacing:.04em; text-transform:uppercase;
    color:var(--blue); background:color-mix(in srgb,var(--blue) 14%,transparent); border-radius:7px; padding:3px 9px; }
  .plan .price { font-size:34px; font-weight:800; letter-spacing:-0.03em; }
  .plan .price small { font-size:15px; font-weight:600; color:var(--muted); }
  .plan .per { color:var(--muted); font-size:14px; margin-top:-6px; }
  .plan ul { list-style:none; display:grid; gap:8px; margin-top:4px; }
  .plan li { display:grid; grid-template-columns:20px 1fr; gap:9px; font-size:14.5px; color:var(--ink); }
  .plan li svg { color:var(--green); margin-top:3px; }
  .freenote { margin-top:18px; color:var(--muted); font-size:14.5px; max-width:64ch; }
  .freenote b { color:var(--ink); }

  /* FAQ */
  .faq { margin-top:30px; display:grid; gap:12px; max-width:800px; }
  details { background:var(--panel); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
  summary { cursor:pointer; padding:16px 18px; font-weight:700; font-size:16px; list-style:none; display:flex; justify-content:space-between; gap:12px; }
  summary::-webkit-details-marker { display:none; }
  summary::after { content:'+'; color:var(--blue); font-weight:800; }
  details[open] summary::after { content:'–'; }
  details p { padding:0 18px 16px; color:var(--muted); }

  /* Footer */
  footer { border-top:1px solid var(--line); background:var(--panel); }
  footer .wrap { padding:36px 22px 48px; display:grid; gap:10px; color:var(--muted); font-size:14px; }
  footer .flinks { display:flex; flex-wrap:wrap; gap:8px 18px; }
  footer a:hover { color:var(--blue); }
  footer .disc { font-size:12.5px; max-width:80ch; line-height:1.55; }

  @media (max-width:820px){
    .hero .wrap { grid-template-columns:1fr; gap:30px; text-align:left; padding:52px 22px 58px; }
    .privacy .wrap { grid-template-columns:1fr; }
    section.pad { padding:56px 0; }
  }
  @media (prefers-reduced-motion:reduce){ html{ scroll-behavior:auto; } * { transition:none!important; } }
</style>
</head>
<body>

<nav><div class="wrap">
  <a class="brand" href="/">
    <svg class="mark" viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="7" fill="#2563EB"/>
      <g transform="translate(4.2 4.2) scale(0.9)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
        <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></g></svg>
    Leve
  </a>
  <div class="links">
    <a class="hideMob" href="#recursos">Recursos</a>
    <a class="hideMob" href="#planos">Planos</a>
    <a class="hideMob" href="#privacidade">Privacidade</a>
    <a class="cta" href="#planos">Ver planos</a>
  </div>
</div></nav>

<header class="hero"><div class="wrap">
  <div>
    <h1>Seu diário de saúde, leve como deve ser.</h1>
    <p class="sub">Registre água, refeições, peso, sintomas e as doses do seu tratamento GLP-1 num lugar só — com gráficos claros, lembretes inteligentes e tudo guardado no seu aparelho.</p>
    <span class="soon"><span class="dot"></span> Em breve na App Store e no Google Play</span>
    <div class="trust">
      <span>🔒 Dados no seu aparelho</span>
      <span>🌍 12 idiomas</span>
      <span>🇧🇷 Feito para o Brasil</span>
    </div>
  </div>
  <div class="phone-col">
    <svg width="270" height="540" viewBox="0 0 270 540" role="img" aria-label="Prévia do app Leve">
      <defs>
        <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="0.5" stop-color="#3B76F0"/><stop offset="1" stop-color="#F6F9FF"/></linearGradient>
      </defs>
      <rect x="6" y="6" width="258" height="528" rx="44" fill="#0B1120"/>
      <rect x="14" y="14" width="242" height="512" rx="38" fill="url(#scr)"/>
      <rect x="98" y="24" width="74" height="20" rx="10" fill="#0B1120"/>
      <!-- saudação -->
      <text x="34" y="76" fill="#fff" font-family="sans-serif" font-size="18" font-weight="700">Olá!</text>
      <text x="34" y="98" fill="#fff" font-family="sans-serif" font-size="13" opacity="0.85">Seu resumo do dia</text>
      <!-- anel de água -->
      <circle cx="135" cy="176" r="52" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="12"/>
      <circle cx="135" cy="176" r="52" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round"
        stroke-dasharray="245 327" transform="rotate(-90 135 176)"/>
      <text x="135" y="172" fill="#fff" font-family="sans-serif" font-size="26" font-weight="800" text-anchor="middle">1.200</text>
      <text x="135" y="192" fill="#fff" font-family="sans-serif" font-size="11" text-anchor="middle" opacity="0.9">ml de água</text>
      <!-- cards -->
      <rect x="26" y="256" width="105" height="88" rx="16" fill="#ffffff"/>
      <text x="42" y="286" fill="#566178" font-family="sans-serif" font-size="11">Peso</text>
      <text x="42" y="312" fill="#0E1B2E" font-family="sans-serif" font-size="22" font-weight="800">92,4</text>
      <text x="42" y="330" fill="#15803D" font-family="sans-serif" font-size="11" font-weight="700">▼ 0,8 kg</text>
      <rect x="139" y="256" width="105" height="88" rx="16" fill="#ffffff"/>
      <text x="155" y="286" fill="#566178" font-family="sans-serif" font-size="11">Próxima dose</text>
      <text x="155" y="312" fill="#0E1B2E" font-family="sans-serif" font-size="20" font-weight="800">em 3 dias</text>
      <text x="155" y="330" fill="#2563EB" font-family="sans-serif" font-size="11" font-weight="700">semaglutida</text>
      <rect x="26" y="356" width="218" height="70" rx="16" fill="#ffffff"/>
      <text x="42" y="384" fill="#566178" font-family="sans-serif" font-size="11">Refeição diária</text>
      <text x="42" y="410" fill="#0E1B2E" font-family="sans-serif" font-size="20" font-weight="800">850 <tspan font-size="12" font-weight="600" fill="#566178">kcal</tspan></text>
      <rect x="150" y="372" width="82" height="8" rx="4" fill="#EAF1FE"/>
      <rect x="150" y="372" width="52" height="8" rx="4" fill="#2563EB"/>
      <rect x="150" y="388" width="82" height="8" rx="4" fill="#EAF1FE"/>
      <rect x="150" y="388" width="34" height="8" rx="4" fill="#4ADE80"/>
      <!-- barra inferior -->
      <rect x="26" y="452" width="218" height="52" rx="18" fill="#ffffff"/>
      <circle cx="60" cy="478" r="7" fill="#2563EB"/><circle cx="103" cy="478" r="6" fill="#C7D6F5"/>
      <circle cx="146" cy="478" r="12" fill="#2563EB"/><circle cx="189" cy="478" r="6" fill="#C7D6F5"/><circle cx="228" cy="478" r="6" fill="#C7D6F5"/>
    </svg>
  </div>
</div></header>

<section class="pad" id="recursos"><div class="wrap">
  <div class="eyebrow">O que o Leve faz</div>
  <h2 class="sec-h">Tudo do seu tratamento, num lugar só</h2>
  <p class="sec-lead">Ferramenta de registro e organização para o dia a dia — simples de usar, honesta com os números.</p>
  <div class="features">
    <div class="card"><div class="ic">💧</div><h3>Água com física real</h3><p>Meta diária ajustada ao seu peso, botões rápidos e um anel d'água que se move com o celular. Lembretes na hora que você escolher.</p></div>
    <div class="card"><div class="ic">🍽️</div><h3>Refeições do Brasil</h3><p>Busca na tabela TACO e em bases oficiais, doces e bebidas locais, porções em gramas ou ml — ou identifique o prato por uma foto.</p></div>
    <div class="card"><div class="ic">💉</div><h3>Doses GLP-1</h3><p>Registro das aplicações com rodízio do local sugerido, próxima dose calculada e nível estimado da medicação — como apoio de memória.</p></div>
    <div class="card"><div class="ic">⚖️</div><h3>Peso e corpo</h3><p>Progresso de peso e composição corporal da sua balança via Apple Saúde ou Health Connect, com relatório em PDF e faixas de referência.</p></div>
    <div class="card"><div class="ic">⏰</div><h3>Lembretes que aprendem</h3><p>Hora de dormir e "bom dia com um copo d'água" a partir do seu sono, e um aviso para levantar quando você fica muito tempo parado.</p></div>
    <div class="card"><div class="ic">🌍</div><h3>12 idiomas, duas medidas</h3><p>Português, inglês, espanhol e mais — com sistema métrico ou imperial automático pela região do aparelho.</p></div>
  </div>
</div></section>

<section class="pad" style="background:var(--panel)"><div class="wrap">
  <div class="eyebrow">Como funciona</div>
  <h2 class="sec-h">Três passos, todo dia mais leve</h2>
  <div class="steps">
    <div class="step"><div class="n">1</div><h3>Registre</h3><p>Água, refeições, peso, doses e sintomas em poucos toques — ou por foto do prato. Funciona offline.</p></div>
    <div class="step"><div class="n">2</div><h3>Conecte a saúde</h3><p>Ligue ao Apple Saúde ou Health Connect e receba sono, batimentos, passos e a composição da sua balança automaticamente.</p></div>
    <div class="step"><div class="n">3</div><h3>Acompanhe</h3><p>Gráficos claros, observações informativas e um relatório em PDF para levar às suas consultas.</p></div>
  </div>
</div></section>

<section class="privacy" id="privacidade"><div class="wrap">
  <svg class="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
  <div>
    <h2>Privacidade em primeiro lugar</h2>
    <p>Seus registros ficam no seu aparelho. As integrações de saúde só funcionam com a sua permissão, as fotos de refeição não são armazenadas e nada é usado para publicidade. O backup é opcional e criptografado de ponta a ponta — nem nosso servidor consegue ler.</p>
  </div>
</div></section>

<section class="pad" id="planos"><div class="wrap">
  <div class="eyebrow">Planos</div>
  <h2 class="sec-h">Comece grátis, evolua quando quiser</h2>
  <p class="sec-lead">O essencial é gratuito. O Leve Premium desbloqueia a análise de foto, a saúde conectada, o controle de medicamentos, a academia, o ciclo e o relatório corporal.</p>
  <div class="plans">
    <div class="plan">
      <span class="tag">Mensal</span>
      <div class="price">R$ 11,90<small> /mês</small></div>
      <div class="per">Renovação mensal, cancele quando quiser.</div>
      <ul>
        <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Todos os recursos Premium</li>
        <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Análise de foto e saúde conectada</li>
      </ul>
    </div>
    <div class="plan best">
      <span class="tag">Anual · melhor preço</span>
      <div class="price">R$ 107,10<small> /ano</small></div>
      <div class="per">Equivale a R$ 8,93/mês — cerca de 3 meses grátis.</div>
      <ul>
        <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Tudo do plano mensal</li>
        <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Economize ~25% no ano</li>
      </ul>
    </div>
  </div>
  <p class="freenote"><b>É profissional de saúde ou parceiro?</b> O Leve tem chaves de acesso Premium para você distribuir aos seus pacientes, sem passar pela loja. Fale conosco.</p>
</div></section>

<section class="pad" style="background:var(--panel)"><div class="wrap">
  <div class="eyebrow">Perguntas frequentes</div>
  <h2 class="sec-h">Ainda em dúvida?</h2>
  <div class="faq">
    <details><summary>O Leve substitui meu médico?</summary><p>Não. O Leve registra e organiza suas informações — não fornece diagnóstico nem orientação sobre dose. Decisões sobre medicamentos, ajustes e tratamento são sempre do seu médico.</p></details>
    <details><summary>Meus dados ficam seguros?</summary><p>Sim. Seus registros ficam no seu aparelho. O backup é opcional e criptografado de ponta a ponta, então nem nós conseguimos ler. Nada é usado para publicidade nem compartilhado com terceiros.</p></details>
    <details><summary>Funciona sem internet?</summary><p>Sim. O registro do dia a dia funciona offline. A análise de foto e a importação da saúde conectada usam conexão quando você as utiliza.</p></details>
    <details><summary>Preciso de uma balança especial?</summary><p>Não. Você pode registrar tudo manualmente. Se tiver uma balança que envia os dados ao Apple Saúde ou ao Health Connect, o Leve importa a composição corporal automaticamente.</p></details>
    <details><summary>Como cancelo a assinatura?</summary><p>Pelas configurações da sua conta na App Store ou no Google Play, quando quiser. A assinatura renova automaticamente até você cancelar.</p></details>
  </div>
</div></section>

<footer><div class="wrap">
  <a class="brand" href="/" style="font-size:17px; margin-bottom:6px;">
    <svg class="mark" viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="7" fill="#2563EB"/>
      <g transform="translate(4.2 4.2) scale(0.9)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
        <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></g></svg>
    Leve
  </a>
  <div class="flinks">
    <a href="/privacidade">Política de privacidade</a>
    <a href="/termos">Termos de uso</a>
    <a href="/aviso-medico">Aviso médico</a>
    <a href="mailto:jdobrito@gmail.com">Contato</a>
  </div>
  <div>© 2026 Jorge Brito e Jorge Manoel Reis Brito · www.levemobile.com.br</div>
  <p class="disc">O Leve é uma ferramenta de registro e organização e não substitui consulta, diagnóstico ou tratamento por profissionais de saúde. Valores nutricionais e de composição corporal são estimativas informativas. Em emergência, procure atendimento imediatamente (no Brasil, SAMU 192).</p>
</div></footer>

</body>
</html>`;
