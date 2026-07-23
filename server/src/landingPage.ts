export const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Leve · Diário de saúde no tratamento GLP-1</title>
<link rel="icon" type="image/png" href="/favicon.png"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="description" content="O Leve organiza seu dia a dia de saúde no tratamento GLP-1: água, refeições com a tabela TACO, peso, doses e treinos do relógio. Em 12 idiomas, com tudo guardado no seu aparelho."/>
<style>
  :root{
    --bg:#090E17; --bg2:#0C1320; --surface:#131C2B; --surface2:#182338;
    --ink:#EAF1FC; --muted:#98A7C2; --faint:#6B7A96; --line:#1F2C42;
    --blue:#4F8DF6; --blue-2:#6EA2F8; --green:#3BD8A0; --green-ink:#3BD8A0;
    --glow:rgba(79,141,246,.32); --shadow:0 22px 60px -30px rgba(0,0,0,.82);
    --r:18px; --maxw:1120px;
  }
  :root.light{
    --bg:#F5F8FF; --bg2:#FFFFFF; --surface:#FFFFFF; --surface2:#EEF4FF;
    --ink:#0E1B2E; --muted:#51617C; --faint:#8393AD; --line:#E1EAF6;
    --blue:#2563EB; --blue-2:#1D4ED8; --green:#15803D; --green-ink:#15803D;
    --glow:rgba(37,99,235,.16); --shadow:0 22px 50px -28px rgba(37,99,235,.26);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  section[id],header[id]{scroll-margin-top:80px}
  body{background:var(--bg);color:var(--ink);
    font:16px/1.62 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 22px}
  h1,h2,h3{line-height:1.1;letter-spacing:-.021em;text-wrap:balance}
  .eyebrow{color:var(--blue);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:12px}
  svg{flex-shrink:0}
  .skip{position:absolute;left:-999px}
  .skip:focus{left:12px;top:12px;background:var(--blue);color:#fff;padding:8px 14px;border-radius:8px;z-index:99}
  :focus-visible{outline:2.5px solid var(--blue);outline-offset:3px;border-radius:6px}

  nav{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 80%,transparent);
    backdrop-filter:blur(14px) saturate(1.4);border-bottom:1px solid var(--line)}
  nav .wrap{display:flex;align-items:center;gap:16px;height:64px}
  .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:19px}
  .brand svg{width:30px;height:30px;display:block}
  .nlinks{margin-left:auto;display:flex;gap:26px;align-items:center}
  .nlinks a{color:var(--muted);font-size:14.5px;font-weight:600;transition:color .2s}
  .nlinks a:hover{color:var(--ink)}
  .tools{display:flex;align-items:center;gap:10px}
  .icobtn{width:40px;height:40px;border-radius:11px;border:1px solid var(--line);background:var(--surface);
    color:var(--ink);display:grid;place-items:center;cursor:pointer;transition:.2s}
  .icobtn:hover{border-color:var(--blue);color:var(--blue)}
  .btn{display:inline-flex;align-items:center;gap:8px;background:var(--blue);color:#fff;font-weight:700;
    padding:11px 18px;border-radius:12px;font-size:14.5px;border:0;cursor:pointer;transition:transform .15s,box-shadow .2s}
  .btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px -12px var(--glow)}
  .btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
  .btn.ghost:hover{border-color:var(--blue);color:var(--blue);box-shadow:none}
  .menu-btn{display:none}

  .hero{position:relative;overflow:hidden}
  .hero::before{content:"";position:absolute;inset:0;background:
    radial-gradient(64% 56% at 80% 6%,var(--glow),transparent 60%),
    radial-gradient(46% 46% at 4% 94%,color-mix(in srgb,var(--green) 20%,transparent),transparent 60%);
    pointer-events:none}
  .hero .wrap{position:relative;display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center;padding:74px 22px 82px}
  .hero h1{font-size:clamp(34px,5.4vw,56px);font-weight:800;max-width:15ch}
  .hero .sub{margin-top:20px;font-size:clamp(16px,1.6vw,19px);color:var(--muted);max-width:44ch}
  .hero .actions{margin-top:30px;display:flex;gap:12px;flex-wrap:wrap}
  .chips{margin-top:26px;display:flex;flex-wrap:wrap;gap:10px}
  .chip{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);
    border-radius:999px;padding:8px 14px;font-size:13.5px;color:var(--ink);font-weight:600}
  .chip svg{width:16px;height:16px;color:var(--blue)}
  .phone-col{display:flex;justify-content:center;position:relative;padding:20px 30px}
  .phone{filter:drop-shadow(0 40px 60px rgba(0,0,0,.45));animation:float 6s ease-in-out infinite}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  .float-card{position:absolute;background:var(--surface);border:1px solid var(--line);border-radius:14px;
    padding:10px 13px;box-shadow:var(--shadow);display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;color:var(--ink)}
  .float-card .dot{width:30px;height:30px;border-radius:9px;display:grid;place-items:center}
  .float-card .dot svg{width:16px;height:16px}
  .fc1{top:12%;left:2%;animation:float 5s ease-in-out infinite}
  .fc2{bottom:14%;right:1%;animation:float 7s ease-in-out infinite .5s}

  section.pad{padding:78px 0}
  .sec-head{max-width:62ch}
  .sec-h{font-size:clamp(25px,3.4vw,36px);font-weight:800;margin:9px 0 8px}
  .sec-lead{color:var(--muted);font-size:17px}
  .grid{margin-top:38px;display:grid;gap:18px;grid-template-columns:repeat(3,1fr)}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:24px;
    transition:transform .2s,border-color .2s,box-shadow .2s}
  .card:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--blue) 45%,var(--line));box-shadow:var(--shadow)}
  .card .ic{width:46px;height:46px;border-radius:13px;background:var(--surface2);color:var(--blue);
    display:grid;place-items:center;margin-bottom:14px}
  .card .ic svg{width:23px;height:23px}
  .card h3{font-size:18px;font-weight:700;margin-bottom:6px}
  .card p{color:var(--muted);font-size:14.5px}

  .steps{margin-top:38px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  .step .n{width:44px;height:44px;border-radius:13px;background:linear-gradient(140deg,var(--blue),var(--blue-2));
    color:#fff;font-weight:800;font-size:19px;display:grid;place-items:center;margin-bottom:14px;box-shadow:0 10px 24px -12px var(--glow)}
  .step h3{font-size:18px;font-weight:700;margin-bottom:5px}
  .step p{color:var(--muted);font-size:14.5px}

  .privacy .inner{background:linear-gradient(150deg,color-mix(in srgb,var(--green) 13%,var(--surface)),var(--surface));
    border:1px solid color-mix(in srgb,var(--green) 30%,var(--line));border-radius:24px;
    padding:40px;display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:center}
  .privacy .shield{width:54px;height:54px;color:var(--green-ink)}
  .privacy h2{font-size:clamp(22px,3vw,30px);font-weight:800;color:var(--green-ink)}
  .privacy p{color:var(--ink);max-width:72ch;margin-top:8px;opacity:.92}

  .pricing{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start;max-width:820px}
  .ptoggle{display:inline-flex;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:5px;gap:4px;margin-bottom:18px}
  .ptoggle button{border:0;background:transparent;color:var(--muted);font-weight:700;font-size:14px;padding:9px 18px;border-radius:999px;cursor:pointer;transition:.2s}
  .ptoggle button.on{background:var(--blue);color:#fff}
  .save{margin-left:7px;font-size:11px;font-weight:800;color:var(--green-ink);background:color-mix(in srgb,var(--green) 16%,transparent);padding:3px 8px;border-radius:7px}
  .plan{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:28px;display:grid;gap:13px;align-content:start}
  .plan.best{border-color:var(--blue);box-shadow:0 24px 60px -30px var(--glow)}
  .plan .tag{justify-self:start;font-size:11.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--blue);background:color-mix(in srgb,var(--blue) 15%,transparent);padding:4px 10px;border-radius:8px}
  .plan .price{font-size:38px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;transition:opacity .2s}
  .plan .price small{font-size:15px;font-weight:600;color:var(--muted)}
  .plan .per{color:var(--muted);font-size:14px;margin-top:-6px;min-height:20px}
  .plan ul{list-style:none;display:grid;gap:9px;margin-top:4px}
  .plan li{display:grid;grid-template-columns:20px 1fr;gap:9px;font-size:14.5px}
  .plan li svg{width:16px;height:16px;color:var(--green-ink);margin-top:3px}
  .plan .cta{margin-top:6px}
  .compare{background:transparent;border:1px dashed var(--line);border-radius:22px;padding:26px;display:grid;gap:12px;align-content:start}
  .compare h3{font-size:16px;font-weight:800}
  .compare .row{display:flex;justify-content:space-between;font-size:14.5px;color:var(--muted);padding:8px 0;border-bottom:1px solid var(--line)}
  .compare .row:last-child{border-bottom:0}
  .compare .row b{color:var(--ink);font-variant-numeric:tabular-nums}
  .freenote{margin-top:22px;color:var(--muted);font-size:14.5px;max-width:66ch}
  .freenote b{color:var(--ink)}

  .faq{margin-top:32px;display:grid;gap:12px;max-width:820px}
  details{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:border-color .2s}
  details[open]{border-color:color-mix(in srgb,var(--blue) 40%,var(--line))}
  summary{cursor:pointer;padding:17px 20px;font-weight:700;font-size:16px;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:14px}
  summary::-webkit-details-marker{display:none}
  summary .plus{color:var(--blue);font-weight:800;font-size:22px;transition:transform .25s;line-height:1;flex-shrink:0}
  details[open] summary .plus{transform:rotate(45deg)}
  details p{padding:0 20px 18px;color:var(--muted)}

  .band{background:linear-gradient(140deg,var(--blue),var(--blue-2));color:#fff;border-radius:28px;padding:52px 40px;text-align:center;overflow:hidden}
  .band h2{font-size:clamp(24px,3.4vw,34px);font-weight:800}
  .band p{margin-top:10px;opacity:.94;max-width:52ch;margin-left:auto;margin-right:auto}
  .band .soon{display:inline-flex;align-items:center;gap:9px;margin-top:24px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:11px 22px;font-weight:700}
  .band .soon .g{width:9px;height:9px;border-radius:50%;background:#7EE2A8;box-shadow:0 0 0 5px rgba(126,226,168,.3)}

  footer{border-top:1px solid var(--line);margin-top:78px;padding:40px 0 52px;color:var(--muted);font-size:14px}
  footer .flinks{display:flex;flex-wrap:wrap;gap:8px 20px;margin:12px 0}
  footer a:hover{color:var(--blue)}
  footer .disc{font-size:12.5px;max-width:80ch;line-height:1.55;color:var(--faint)}

  .reveal{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
  .reveal.in{opacity:1;transform:none}

  @media (max-width:980px){ .grid{grid-template-columns:repeat(2,1fr)} }
  @media (max-width:900px){
    .hero .wrap{grid-template-columns:1fr;gap:34px;padding:54px 22px 60px}
    .steps,.pricing{grid-template-columns:1fr}
    .privacy .inner{grid-template-columns:1fr;padding:30px}
    .nlinks{display:none}
    .nlinks.open{display:flex;position:absolute;top:64px;left:0;right:0;flex-direction:column;gap:0;background:var(--bg2);border-bottom:1px solid var(--line);padding:8px 22px 16px}
    .nlinks.open a{padding:12px 0;border-bottom:1px solid var(--line)}
    .menu-btn{display:grid}
  }
  @media (max-width:560px){
    .grid{grid-template-columns:1fr}
    .float-card{display:none}
    .band{padding:40px 24px}
  }
  @media (prefers-reduced-motion:reduce){
    html{scroll-behavior:auto}
    *,.phone,.float-card{animation:none!important;transition:none!important}
    .reveal{opacity:1;transform:none}
  }
</style>
</head>
<body>
<a class="skip" href="#conteudo">Ir para o conteúdo</a>

<nav><div class="wrap">
  <a class="brand" href="#top" aria-label="Leve, página inicial">
    <svg viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="7" fill="#2563EB"/>
      <g transform="translate(4.2 4.2) scale(0.9)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
        <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></g></svg>
    Leve
  </a>
  <div class="nlinks" id="nlinks">
    <a href="#recursos">Recursos</a>
    <a href="#como">Como funciona</a>
    <a href="#planos">Planos</a>
    <a href="#faq">Dúvidas</a>
  </div>
  <div class="tools">
    <button class="icobtn menu-btn" id="menu" aria-label="Abrir menu" aria-expanded="false">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <button class="icobtn" id="theme" aria-label="Alternar modo claro e escuro">
      <svg id="ic-moon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg id="ic-sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    </button>
    <a class="btn" href="#planos">Ver planos</a>
  </div>
</div></nav>

<header class="hero" id="top"><div class="wrap">
  <div>
    <div class="eyebrow">Diário de saúde · GLP-1</div>
    <h1>Organize seu tratamento GLP-1 no dia a dia.</h1>
    <p class="sub">Registre água, refeições, peso, sintomas e as doses do seu tratamento em um lugar só. Os gráficos mostram sua evolução ao longo do tempo e os dados ficam guardados no seu aparelho.</p>
    <div class="actions">
      <a class="btn" href="#planos">Ver planos</a>
      <a class="btn ghost" href="#como">Como funciona</a>
    </div>
    <div class="chips">
      <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg> Dados no seu aparelho</span>
      <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg> 12 idiomas</span>
      <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-4.35-9-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 6.5C18.5 16.65 12 21 12 21z"/></svg> Feito para o Brasil</span>
    </div>
  </div>
  <div class="phone-col" id="conteudo">
    <div class="float-card fc1"><span class="dot" style="background:color-mix(in srgb,var(--green) 18%,transparent);color:var(--green-ink)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17 13.5 8.5l-4 4L2 5"/><path d="M16 17h6v-6"/></svg></span> Peso −0,8 kg</div>
    <div class="float-card fc2"><span class="dot" style="background:color-mix(in srgb,var(--blue) 16%,transparent);color:var(--blue)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7c3 3.5 6 6.8 6 10.1A6 6 0 0 1 6 12.8C6 9.5 9 6.2 12 2.7z"/></svg></span> Meta de água batida</div>
    <svg class="phone" width="256" height="520" viewBox="0 0 256 520" role="img" aria-label="Prévia da tela Hoje do app Leve">
      <defs><linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset=".52" stop-color="#3B76F0"/><stop offset="1" stop-color="#0C1320"/></linearGradient></defs>
      <rect x="4" y="4" width="248" height="512" rx="42" fill="#05070C"/>
      <rect x="12" y="12" width="232" height="496" rx="36" fill="url(#scr)"/>
      <rect x="94" y="22" width="68" height="18" rx="9" fill="#05070C"/>
      <text x="30" y="72" fill="#fff" font-family="sans-serif" font-size="17" font-weight="700">Olá!</text>
      <text x="30" y="92" fill="#fff" font-family="sans-serif" font-size="12" opacity=".85">Seu resumo do dia</text>
      <circle cx="128" cy="168" r="50" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="11"/>
      <circle cx="128" cy="168" r="50" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-dasharray="236 314" transform="rotate(-90 128 168)"/>
      <text x="128" y="165" fill="#fff" font-family="sans-serif" font-size="25" font-weight="800" text-anchor="middle">1.200</text>
      <text x="128" y="184" fill="#fff" font-family="sans-serif" font-size="10.5" text-anchor="middle" opacity=".9">ml de água</text>
      <rect x="24" y="246" width="100" height="84" rx="15" fill="#fff"/>
      <text x="39" y="274" fill="#54637D" font-family="sans-serif" font-size="10.5">Peso</text>
      <text x="39" y="299" fill="#0E1B2E" font-family="sans-serif" font-size="21" font-weight="800">92,4</text>
      <text x="39" y="316" fill="#15803D" font-family="sans-serif" font-size="10.5" font-weight="700">▼ 0,8 kg</text>
      <rect x="132" y="246" width="100" height="84" rx="15" fill="#fff"/>
      <text x="147" y="274" fill="#54637D" font-family="sans-serif" font-size="10.5">Próxima dose</text>
      <text x="147" y="298" fill="#0E1B2E" font-family="sans-serif" font-size="15" font-weight="800">em 3 dias</text>
      <text x="147" y="316" fill="#2563EB" font-family="sans-serif" font-size="10.5" font-weight="700">semaglutida</text>
      <rect x="24" y="342" width="208" height="66" rx="15" fill="#fff"/>
      <text x="39" y="369" fill="#54637D" font-family="sans-serif" font-size="10.5">Refeição diária</text>
      <text x="39" y="393" fill="#0E1B2E" font-family="sans-serif" font-size="19" font-weight="800">850 <tspan font-size="11" font-weight="600" fill="#54637D">kcal</tspan></text>
      <rect x="150" y="360" width="70" height="7" rx="4" fill="#EAF1FE"/><rect x="150" y="360" width="45" height="7" rx="4" fill="#2563EB"/>
      <rect x="150" y="374" width="70" height="7" rx="4" fill="#EAF1FE"/><rect x="150" y="374" width="30" height="7" rx="4" fill="#34D399"/>
      <rect x="24" y="432" width="208" height="50" rx="16" fill="#fff"/>
      <circle cx="56" cy="457" r="6.5" fill="#2563EB"/><circle cx="97" cy="457" r="5.5" fill="#C7D6F5"/><circle cx="138" cy="457" r="11" fill="#2563EB"/><circle cx="179" cy="457" r="5.5" fill="#C7D6F5"/><circle cx="216" cy="457" r="5.5" fill="#C7D6F5"/>
    </svg>
  </div>
</div></header>

<main>
<section class="pad" id="recursos"><div class="wrap">
  <div class="sec-head reveal">
    <div class="eyebrow">O que o Leve faz</div>
    <h2 class="sec-h">Tudo do seu tratamento, em um lugar só</h2>
    <p class="sec-lead">Uma ferramenta de registro e organização para o dia a dia. Não promete resultado nem opina sobre a sua dose.</p>
  </div>
  <div class="grid">
    <div class="card reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7c3.2 3.7 6.3 7.1 6.3 10.6A6.3 6.3 0 0 1 5.7 13.3C5.7 9.8 8.8 6.4 12 2.7z"/></svg></div><h3>Água</h3><p>Meta diária ajustada ao seu peso e botões rápidos. Lembretes para tomar água na hora que você escolher.</p></div>
    <div class="card reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2v7a2.5 2.5 0 0 0 5 0V2M7.5 11.5V22M17 2c-1.7 0-3 2-3 4.5s1.3 3.5 3 3.5V2zM17 10v12"/></svg></div><h3>Refeições do Brasil</h3><p>Busca na tabela TACO e em bases oficiais do IBGE, com doces, salgadinhos e bebidas regionais. Porções em gramas ou mililitros, com calorias, proteína, carboidrato, gordura e fibras. No Premium você também descreve o prato por texto ou identifica por foto.</p></div>
    <div class="card reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.4 3.6 13.5a4.9 4.9 0 0 1 6.9-6.9l6.9 6.9a4.9 4.9 0 0 1-6.9 6.9zM7 10l7 7"/></svg></div><h3>Doses GLP-1</h3><p>Registro das aplicações com rodízio do local sugerido, cálculo da próxima dose e gráfico do nível estimado da medicação. Serve como apoio de memória, não como orientação de dose.</p></div>
    <div class="card reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M12 4a2 2 0 0 0-2 2h4a2 2 0 0 0-2-2zM8.5 15l3.5-5 3.5 5"/></svg></div><h3>Peso e corpo</h3><p>Progresso de peso e composição corporal enviados pela sua balança via Apple Saúde ou Health Connect, com relatório em PDF para levar à consulta.</p></div>
    <div class="card reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><h3>Corrida e caminhada</h3><p>Grave a corrida ou a caminhada pelo GPS do celular e veja distância, tempo, ritmo e o trajeto no mapa. Os treinos gravados no seu relógio entram pelo Apple Saúde ou pelo Health Connect.</p></div>
    <div class="card reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg></div><h3>Lembretes</h3><p>Horário de dormir e o copo d'água da manhã sugeridos a partir do sono que o app lê da sua saúde conectada. Também avisa para levantar depois de muito tempo parado e lembra os remédios de apoio.</p></div>
    <div class="card reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg></div><h3>12 idiomas, duas medidas</h3><p>Português, inglês, espanhol, francês, alemão, japonês e outros. O sistema métrico ou imperial acompanha a região do aparelho.</p></div>
  </div>
</div></section>

<section class="pad" id="como" style="background:var(--bg2)"><div class="wrap">
  <div class="sec-head reveal">
    <div class="eyebrow">Como funciona</div>
    <h2 class="sec-h">Registrar, conectar e acompanhar</h2>
  </div>
  <div class="steps">
    <div class="step reveal"><div class="n">1</div><h3>Registre</h3><p>Água, refeições, peso, doses e sintomas em poucos toques. O registro do dia a dia funciona sem internet.</p></div>
    <div class="step reveal"><div class="n">2</div><h3>Conecte a saúde</h3><p>Ligue ao Apple Saúde ou ao Health Connect para receber sono, batimentos, passos, treinos e a composição da sua balança automaticamente.</p></div>
    <div class="step reveal"><div class="n">3</div><h3>Acompanhe</h3><p>Gráficos de peso, água, calorias e nível da medicação, com um relatório em PDF para levar às suas consultas.</p></div>
  </div>
</div></section>

<section class="pad privacy" id="privacidade"><div class="wrap reveal">
  <div class="inner">
    <svg class="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
    <div>
      <h2>Privacidade em primeiro lugar</h2>
      <p>Seus registros ficam no seu aparelho. As integrações de saúde só funcionam com a sua permissão, as fotos de refeição não são armazenadas e nada é usado para publicidade. O backup é opcional e criptografado de ponta a ponta com uma chave derivada da sua senha, então o servidor guarda apenas um arquivo que não consegue abrir.</p>
    </div>
  </div>
</div></section>

<section class="pad" id="planos"><div class="wrap">
  <div class="sec-head reveal">
    <div class="eyebrow">Planos</div>
    <h2 class="sec-h">Comece grátis, evolua quando quiser</h2>
    <p class="sec-lead">O essencial é gratuito. O Leve Premium desbloqueia a análise de foto, a saúde conectada, o controle de medicamentos, a academia, o ciclo e o relatório corporal.</p>
  </div>
  <div class="pricing reveal">
    <div class="plan best">
      <div class="ptoggle" role="group" aria-label="Escolher periodicidade do Premium">
        <button id="tab-m" class="on" aria-pressed="true">Mensal</button>
        <button id="tab-a" aria-pressed="false">Anual <span class="save">−25%</span></button>
      </div>
      <span class="tag">Leve Premium</span>
      <div class="price"><span id="pv">R$ 11,90</span><small id="pp"> /mês</small></div>
      <div class="per" id="per">Renova todo mês, cancele quando quiser.</div>
      <ul>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Análise de comida por foto</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Saúde conectada e composição corporal</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Medicamentos, academia, ciclo e relatório PDF</li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Consultas com avisos no dia e horas antes</li>
      </ul>
      <a class="btn cta" href="#baixar">Em breve nas lojas</a>
    </div>
    <div class="compare">
      <h3>Compare</h3>
      <div class="row"><span>Grátis</span><b>R$ 0</b></div>
      <div class="row"><span>Premium mensal</span><b>R$ 11,90/mês</b></div>
      <div class="row"><span>Premium anual</span><b>R$ 106,90/ano</b></div>
      <div class="row"><span>Economia no anual</span><b style="color:var(--green-ink)">~25%</b></div>
      <p style="color:var(--muted);font-size:13.5px;margin-top:4px">Cobrado pela App Store ou Google Play. Renova automaticamente até você cancelar.</p>
    </div>
  </div>
  <p class="freenote reveal"><b>É profissional de saúde ou parceiro?</b> O Leve tem chaves de acesso Premium para você distribuir aos seus pacientes, sem passar pela loja. Fale conosco pelo e-mail do rodapé.</p>
</div></section>

<section class="pad" id="faq" style="background:var(--bg2)"><div class="wrap">
  <div class="sec-head reveal">
    <div class="eyebrow">Perguntas frequentes</div>
    <h2 class="sec-h">Ainda em dúvida?</h2>
  </div>
  <div class="faq reveal">
    <details><summary>O Leve substitui meu médico? <span class="plus">+</span></summary><p>Não. O Leve registra e organiza suas informações. Ele não fornece diagnóstico nem orientação sobre dose. Decisões sobre medicamentos, ajustes e tratamento são sempre do seu médico.</p></details>
    <details><summary>Meus dados ficam seguros? <span class="plus">+</span></summary><p>Sim. Seus registros ficam no seu aparelho. O backup é opcional e criptografado de ponta a ponta, então nem nós conseguimos ler. Nada é usado para publicidade nem compartilhado com terceiros.</p></details>
    <details><summary>Funciona sem internet? <span class="plus">+</span></summary><p>Sim. O registro do dia a dia funciona offline. A análise de foto e a importação da saúde conectada usam conexão quando você as utiliza.</p></details>
    <details><summary>Preciso de uma balança especial? <span class="plus">+</span></summary><p>Não. Você pode registrar tudo manualmente. Se tiver uma balança que envia os dados ao Apple Saúde ou ao Health Connect, o Leve importa a composição corporal automaticamente.</p></details>
    <details><summary>Como cancelo a assinatura? <span class="plus">+</span></summary><p>Pelas configurações da sua conta na App Store ou no Google Play, quando quiser. A assinatura renova automaticamente até você cancelar.</p></details>
  </div>
</div></section>

<section class="pad" id="baixar"><div class="wrap reveal">
  <div class="band">
    <h2>Comece a registrar seu tratamento</h2>
    <p>Um diário para acompanhar o tratamento, com os seus dados guardados no aparelho.</p>
    <span class="soon"><span class="g"></span> Em breve na App Store e no Google Play</span>
  </div>
</div></section>
</main>

<footer><div class="wrap">
  <a class="brand" href="#top" style="font-size:17px">
    <svg viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="7" fill="#2563EB"/>
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
  <div>© 2026 Jorge Brito, Jorge Manoel Brito e Alairton Silva · levemobile.com.br</div>
  <p class="disc">O Leve é uma ferramenta de registro e organização e não substitui consulta, diagnóstico ou tratamento por profissionais de saúde. Valores nutricionais e de composição corporal são estimativas informativas. Em emergência, procure atendimento imediatamente (no Brasil, SAMU 192).</p>
</div></footer>

<script>
  (function(){
    var root=document.documentElement;
    var saved=null; try{saved=localStorage.getItem('leve-theme')}catch(e){}
    if(saved==='light')root.classList.add('light');
    function syncIcons(){var l=root.classList.contains('light');
      document.getElementById('ic-moon').style.display=l?'none':'block';
      document.getElementById('ic-sun').style.display=l?'block':'none';}
    syncIcons();
    document.getElementById('theme').addEventListener('click',function(){
      root.classList.toggle('light');
      try{localStorage.setItem('leve-theme',root.classList.contains('light')?'light':'dark')}catch(e){}
      syncIcons();
    });
    var menu=document.getElementById('menu'),nl=document.getElementById('nlinks');
    menu.addEventListener('click',function(){var o=nl.classList.toggle('open');menu.setAttribute('aria-expanded',o)});
    nl.addEventListener('click',function(e){if(e.target.tagName==='A'){nl.classList.remove('open');menu.setAttribute('aria-expanded','false')}});
    var tm=document.getElementById('tab-m'),ta=document.getElementById('tab-a');
    function setPlan(m){
      tm.classList.toggle('on',m);ta.classList.toggle('on',!m);
      tm.setAttribute('aria-pressed',m);ta.setAttribute('aria-pressed',!m);
      document.getElementById('pv').textContent=m?'R$ 11,90':'R$ 106,90';
      document.getElementById('pp').textContent=m?' /mês':' /ano';
      document.getElementById('per').textContent=m?'Renova todo mês, cancele quando quiser.':'Equivale a R$ 8,91/mês, cerca de 3 meses grátis.';
    }
    tm.addEventListener('click',function(){setPlan(true)});
    ta.addEventListener('click',function(){setPlan(false)});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  })();
</script>
</body>
</html>`;
