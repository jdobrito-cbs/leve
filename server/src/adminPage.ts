/** Painel do dono: gerar, listar e revogar chaves de parceiro. Servido em /painel.
 *  Mesmo visual do site (modo escuro por padrão + alternador). Segurança:
 *  esc() antes de qualquer innerHTML (anti-XSS) e token em sessionStorage. */
export const ADMIN_PAGE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Leve · Painel de parceiros</title>
<style>
  :root{
    --bg:#090E17; --bg2:#0C1320; --surface:#131C2B; --surface2:#182338;
    --ink:#EAF1FC; --muted:#98A7C2; --faint:#6B7A96; --line:#1F2C42;
    --blue:#4F8DF6; --blue-2:#6EA2F8; --green:#3BD8A0; --red:#F87171;
    --glow:rgba(79,141,246,.30); --r:16px;
  }
  :root.light{
    --bg:#F5F8FF; --bg2:#FFFFFF; --surface:#FFFFFF; --surface2:#EEF4FF;
    --ink:#0E1B2E; --muted:#51617C; --faint:#8393AD; --line:#E1EAF6;
    --blue:#2563EB; --blue-2:#1D4ED8; --green:#15803D; --red:#DC2626;
    --glow:rgba(37,99,235,.16);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--bg);color:var(--ink);min-height:100vh;
    font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
  .mono{font-family:ui-monospace,"Cascadia Code",Consolas,monospace}
  .wrap{max-width:780px;margin:0 auto;padding:0 20px 60px}
  :focus-visible{outline:2.5px solid var(--blue);outline-offset:3px;border-radius:6px}
  header{display:flex;align-items:center;gap:14px;padding:22px 0 6px}
  .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:19px}
  .brand svg{width:30px;height:30px;display:block}
  .icobtn{margin-left:auto;width:40px;height:40px;border-radius:11px;border:1px solid var(--line);
    background:var(--surface);color:var(--ink);display:grid;place-items:center;cursor:pointer;transition:.2s}
  .icobtn:hover{border-color:var(--blue);color:var(--blue)}
  h1{font-size:22px;font-weight:800;margin-top:14px} h1 b{color:var(--blue)}
  p.lead{color:var(--muted);font-size:14px;margin:6px 0 22px;max-width:64ch}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:20px;margin-bottom:16px}
  label{font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:6px}
  input{width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:11px;font-size:15px;
    background:var(--bg2);color:var(--ink);transition:border-color .2s}
  input::placeholder{color:var(--faint)}
  input:focus{outline:none;border-color:var(--blue)}
  .btn{background:var(--blue);color:#fff;border:0;border-radius:11px;padding:11px 18px;font-size:14px;
    font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .2s;white-space:nowrap}
  .btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px -12px var(--glow)}
  .btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line);box-shadow:none}
  .btn.ghost:hover{border-color:var(--blue);color:var(--blue);transform:none}
  .btn.danger{background:color-mix(in srgb,var(--red) 16%,transparent);color:var(--red);padding:7px 12px;font-size:12.5px}
  .btn.danger:hover{background:color-mix(in srgb,var(--red) 24%,transparent);transform:none;box-shadow:none}
  .row{display:flex;gap:12px;align-items:flex-end}
  .row>div{flex:1}
  .newkey{background:color-mix(in srgb,var(--blue) 12%,var(--surface));border:1px dashed var(--blue);
    border-radius:12px;padding:16px;margin-top:14px;font-size:19px;font-weight:800;letter-spacing:1.5px;
    text-align:center;color:var(--blue);user-select:all}
  .hintnote{font-size:12.5px;color:var(--muted);margin-top:8px;text-align:center}
  .err{color:var(--red);font-size:13px;margin-top:10px}
  .thead{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
  .thead label{margin:0;font-size:14px;color:var(--ink);font-weight:700}
  .tblwrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{text-align:left;padding:11px 8px;border-bottom:1px solid var(--line);white-space:nowrap}
  th{color:var(--muted);font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em}
  tr:last-child td{border-bottom:0}
  .tag{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px}
  .tag.on{background:color-mix(in srgb,var(--green) 16%,transparent);color:var(--green)}
  .tag.off{background:color-mix(in srgb,var(--red) 16%,transparent);color:var(--red)}
  .empty{color:var(--faint);text-align:center;padding:18px}
  footer{color:var(--faint);font-size:12px;text-align:center;margin-top:24px}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        <svg viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="7" fill="#2563EB"/>
          <g transform="translate(4.2 4.2) scale(0.9)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
            <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></g></svg>
        Leve
      </div>
      <button class="icobtn" id="theme" aria-label="Alternar modo claro e escuro">
        <svg id="ic-moon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg id="ic-sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </header>

    <h1><b>Painel</b> de parceiros</h1>
    <p class="lead">Gere chaves premium para parceiros e revogue quando quiser. O código completo aparece só na criação — copie e envie na hora.</p>

    <div class="card">
      <label for="token">Código de acesso do painel (ADMIN_TOKEN)</label>
      <input id="token" type="password" placeholder="cole o código definido no servidor"/>
    </div>

    <div class="card">
      <div class="row">
        <div>
          <label for="label">Nome do parceiro</label>
          <input id="label" placeholder="ex.: Dra. Ana — nutricionista"/>
        </div>
        <button class="btn" onclick="createKey()">Gerar chave</button>
      </div>
      <div id="created"></div>
      <div id="createErr" class="err"></div>
    </div>

    <div class="card">
      <div class="thead">
        <label>Chaves emitidas</label>
        <button class="btn ghost" onclick="loadKeys()">Atualizar</button>
      </div>
      <div class="tblwrap"><table>
        <thead><tr><th>Parceiro</th><th>Final</th><th>Criada em</th><th>Situação</th><th></th></tr></thead>
        <tbody id="rows"><tr><td colspan="5" class="empty">Informe o código e clique em Atualizar.</td></tr></tbody>
      </table></div>
      <div id="listErr" class="err"></div>
    </div>

    <footer>Área restrita · www.levemobile.com.br/painel</footer>
  </div>

<script>
  // Tema: padrão escuro; respeita escolha salva.
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
  })();

  // Escapa dados vindos do servidor antes de ir para innerHTML (anti-XSS):
  // um rótulo de parceiro com HTML não pode executar no painel autenticado.
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  const tokenInput = document.getElementById('token');
  // sessionStorage (não localStorage): o código de acesso não persiste após
  // fechar o navegador — reduz o risco em máquina compartilhada.
  tokenInput.value = sessionStorage.getItem('leveAdminToken') || '';
  tokenInput.addEventListener('change', () => sessionStorage.setItem('leveAdminToken', tokenInput.value));

  function headers() {
    return { 'content-type': 'application/json', authorization: 'Bearer ' + tokenInput.value };
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
  }

  async function loadKeys() {
    document.getElementById('listErr').textContent = '';
    try {
      const res = await fetch('/partner-keys', { headers: headers() });
      if (res.status === 401) throw new Error('código de acesso incorreto');
      if (!res.ok) throw new Error('falha ao listar (' + res.status + ')');
      const keys = await res.json();
      const rows = keys.map(k =>
        '<tr><td>' + esc(k.label) + '</td><td class="mono">…' + esc(k.hint) + '</td><td class="mono">' + esc(fmtDate(k.createdAt)) + '</td>' +
        '<td>' + (k.revokedAt ? '<span class="tag off">revogada</span>' : '<span class="tag on">ativa</span>') + '</td>' +
        '<td>' + (k.revokedAt ? '' : '<button class="btn danger" onclick="revoke(\\'' + esc(k.id) + '\\')">Revogar</button>') + '</td></tr>'
      ).join('');
      document.getElementById('rows').innerHTML =
        rows || '<tr><td colspan="5" class="empty">Nenhuma chave emitida ainda.</td></tr>';
    } catch (e) {
      document.getElementById('listErr').textContent = e.message;
    }
  }

  async function createKey() {
    document.getElementById('createErr').textContent = '';
    const label = document.getElementById('label').value.trim();
    if (!label) { document.getElementById('createErr').textContent = 'informe o nome do parceiro'; return; }
    try {
      const res = await fetch('/partner-keys', { method:'POST', headers: headers(), body: JSON.stringify({ label }) });
      if (res.status === 401) throw new Error('código de acesso incorreto');
      if (!res.ok) throw new Error('falha ao gerar (' + res.status + ')');
      const created = await res.json();
      document.getElementById('created').innerHTML =
        '<div class="newkey">' + esc(created.key) + '</div>' +
        '<div class="hintnote">Chave de ' + esc(created.label) + ' — copie e envie agora; ela não será exibida de novo.</div>';
      document.getElementById('label').value = '';
      loadKeys();
    } catch (e) {
      document.getElementById('createErr').textContent = e.message;
    }
  }

  async function revoke(id) {
    if (!confirm('Revogar esta chave? O parceiro perde o acesso premium na próxima verificação.')) return;
    try {
      const res = await fetch('/partner-keys/' + id + '/revoke', { method:'POST', headers: headers() });
      if (!res.ok) throw new Error('falha ao revogar (' + res.status + ')');
      loadKeys();
    } catch (e) {
      document.getElementById('listErr').textContent = e.message;
    }
  }
</script>
</body>
</html>`;
