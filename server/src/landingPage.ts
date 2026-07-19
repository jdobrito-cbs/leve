/**
 * Landing page do Leve — servida na raiz do domínio (www.levemobile.com.br).
 * Página única, sem dependências externas, com a identidade visual do app
 * (azul #2563EB, broto no logo). Conteúdo alinhado ao design responsável:
 * o Leve registra e organiza; não presta consulta nem orienta dose.
 */

export const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Leve — Seu diário de saúde</title>
<meta name="description" content="O Leve organiza seu dia a dia de saúde: água, refeições com base TACO, peso, doses do tratamento GLP-1, sintomas e relatórios — tudo no seu aparelho, em 12 idiomas."/>
<style>
  :root {
    --blue: #2563EB; --blue-soft: #EFF6FF; --blue-2: #60A5FA;
    --ink: #0F172A; --muted: #5B6B82; --line: #E2E8F0; --bg: #FFFFFF;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0B1120; --ink: #E7EDF7; --muted: #93A3BC; --line: #24304A; --blue-soft: #16233E; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--ink);
    font: 16px/1.65 -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 1020px; margin: 0 auto; padding: 0 22px; }

  .hero { background: linear-gradient(160deg, var(--blue) 0%, var(--blue-2) 90%);
    color: #fff; padding: 64px 0 72px; }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
  .brand b { font-size: 20px; letter-spacing: .01em; }
  .hero h1 { font-size: clamp(30px, 5.5vw, 46px); line-height: 1.12; max-width: 17ch;
    text-wrap: balance; }
  .hero p.sub { margin-top: 16px; max-width: 52ch; font-size: 18px; opacity: .92; }
  .soon { display: inline-block; margin-top: 28px; background: rgba(255,255,255,.16);
    border: 1px solid rgba(255,255,255,.45); border-radius: 999px; padding: 9px 20px;
    font-weight: 600; font-size: 14.5px; }

  section { padding: 56px 0; }
  section + section { border-top: 1px solid var(--line); }
  h2 { font-size: 26px; margin-bottom: 8px; text-wrap: balance; }
  p.lead { color: var(--muted); max-width: 62ch; }

  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px; margin-top: 28px; }
  .card { border: 1px solid var(--line); border-radius: 16px; padding: 20px;
    display: grid; gap: 8px; align-content: start; }
  .card .ico { width: 40px; height: 40px; border-radius: 12px; background: var(--blue-soft);
    display: grid; place-items: center; color: var(--blue); font-size: 19px; }
  .card h3 { font-size: 17px; }
  .card p { color: var(--muted); font-size: 14.5px; }

  .privacy { background: var(--blue-soft); border-radius: 20px; padding: 30px;
    margin-top: 28px; display: grid; gap: 8px; }
  .privacy h3 { color: var(--blue); font-size: 18px; }
  .privacy p { color: var(--muted); max-width: 70ch; }

  .notice { border-left: 4px solid var(--blue); padding: 4px 0 4px 16px;
    color: var(--muted); max-width: 74ch; font-size: 14.5px; }

  footer { border-top: 1px solid var(--line); padding: 30px 0 44px; color: var(--muted);
    font-size: 14px; display: grid; gap: 6px; }
  footer .langs { font-size: 13px; }
  a { color: var(--blue); }
</style>
</head>
<body>
  <header class="hero"><div class="wrap">
    <div class="brand">
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <rect width="44" height="44" rx="10" fill="rgba(255,255,255,.18)"/>
        <g transform="translate(8 8) scale(1.15)" fill="none" stroke="#FFFFFF" stroke-width="1.9"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
          <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/>
          <path d="M5 21h14"/>
        </g>
      </svg>
      <b>Leve</b>
    </div>
    <h1>Seu diário de saúde, leve como deve ser.</h1>
    <p class="sub">Registre água, refeições, peso, sintomas e as doses do seu tratamento
      GLP-1 num lugar só — com gráficos claros, lembretes inteligentes e os dados
      guardados no seu aparelho.</p>
    <span class="soon">Em breve na App Store e no Google Play</span>
  </div></header>

  <main class="wrap">
    <section>
      <h2>O que o Leve faz por você</h2>
      <p class="lead">Ferramenta de registro e organização para o dia a dia do tratamento —
        simples de usar, honesta com os números.</p>
      <div class="grid">
        <div class="card"><span class="ico">💧</span><h3>Água com meta e física real</h3>
          <p>Meta diária calculada pelo seu peso, botões rápidos e um anel d'água que se move
            com o celular. Lembretes nos horários que você escolher.</p></div>
        <div class="card"><span class="ico">🍽️</span><h3>Refeições com base brasileira</h3>
          <p>Busca nas tabelas oficiais (TACO, IBGE), pratos salvos, doces e bebidas do Brasil,
            porções em gramas ou ml e foto do prato com identificação por IA.</p></div>
        <div class="card"><span class="ico">💉</span><h3>Doses do tratamento GLP-1</h3>
          <p>Registro de aplicações com rodízio de local sugerido, próxima dose calculada e
            curva estimada do nível da medicação — como apoio de memória.</p></div>
        <div class="card"><span class="ico">⚖️</span><h3>Peso e corpo de verdade</h3>
          <p>Progresso de peso, composição corporal da sua balança via Apple Saúde ou Health
            Connect e relatório em PDF com faixas de referência.</p></div>
        <div class="card"><span class="ico">⏰</span><h3>Lembretes que aprendem</h3>
          <p>Hora de dormir e "bom dia + copo d'água" detectados do seu sono, aviso para
            levantar quando você fica muito tempo parado e remédios de apoio na hora certa.</p></div>
        <div class="card"><span class="ico">🌍</span><h3>12 idiomas, duas medidas</h3>
          <p>Português, inglês, espanhol, francês, alemão, japonês, chinês, árabe, hebraico e
            hindi — com sistema métrico ou imperial automático pela região.</p></div>
      </div>

      <div class="privacy">
        <h3>Privacidade em primeiro lugar</h3>
        <p>Seus registros ficam no seu aparelho. Integrações de saúde só funcionam com a sua
          permissão, fotos de refeição não são armazenadas e nada é usado para publicidade.
          Conta e backup são opcionais e cifrados.</p>
      </div>
    </section>

    <section>
      <h2>Compromisso com a sua segurança</h2>
      <p class="notice">O Leve é uma ferramenta de registro e organização — não substitui
        consulta, diagnóstico nem tratamento por profissionais de saúde. Decisões sobre
        medicamentos, doses e dieta são sempre do seu médico. Valores nutricionais e de
        composição corporal são estimativas informativas baseadas em tabelas oficiais.</p>
    </section>
  </main>

  <footer><div class="wrap">
    <div>© 2026 Jorge Brito e Jorge Manoel Reis Brito · Leve</div>
    <div>Contato: <a href="mailto:jdobrito@gmail.com">jdobrito@gmail.com</a></div>
    <div class="langs">www.levemobile.com.br</div>
  </div></footer>
</body>
</html>`;
