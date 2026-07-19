/** Painel do dono: gerar, listar e revogar chaves de parceiro. Servido em /admin. */
export const ADMIN_PAGE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Leve · Painel de parceiros</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:-apple-system,'Segoe UI',Roboto,sans-serif; }
  body { background:#F4F6FB; color:#0F172A; padding:24px; max-width:760px; margin:0 auto; }
  h1 { font-size:22px; margin-bottom:4px; } h1 b { color:#2563EB; }
  p.sub { color:#64748B; margin-bottom:20px; font-size:14px; }
  .card { background:#fff; border-radius:16px; padding:18px; margin-bottom:16px;
    box-shadow:0 4px 18px rgba(30,58,138,.07); }
  label { font-size:12px; color:#64748B; display:block; margin-bottom:4px; }
  input { width:100%; padding:10px 12px; border:1px solid #E2E8F0; border-radius:10px;
    font-size:15px; margin-bottom:10px; }
  button { background:#2563EB; color:#fff; border:0; border-radius:10px; padding:10px 16px;
    font-size:14px; font-weight:600; cursor:pointer; }
  button.ghost { background:#EFF6FF; color:#2563EB; }
  button.danger { background:#FEE2E2; color:#DC2626; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { text-align:left; padding:9px 8px; border-bottom:1px solid #EEF2F7; }
  th { color:#64748B; font-weight:600; font-size:12px; }
  .tag { font-size:11px; font-weight:700; padding:3px 8px; border-radius:99px; }
  .tag.on { background:#DCFCE7; color:#16A34A; } .tag.off { background:#FEE2E2; color:#DC2626; }
  .newkey { background:#EFF6FF; border:1px dashed #2563EB; border-radius:12px; padding:14px;
    margin-top:12px; font-size:18px; font-weight:700; letter-spacing:1px; text-align:center;
    color:#1D4ED8; user-select:all; }
  .hintnote { font-size:12px; color:#64748B; margin-top:6px; text-align:center; }
  .err { color:#DC2626; font-size:13px; margin-top:8px; }
  .row { display:flex; gap:10px; align-items:flex-end; }
  .row > div { flex:1; }
</style>
</head>
<body>
  <h1><b>Leve</b> · Painel de parceiros</h1>
  <p class="sub">Gere chaves premium para parceiros e revogue quando quiser. O código completo aparece só na criação — guarde na hora.</p>

  <div class="card">
    <label>Código de acesso do painel (ADMIN_TOKEN)</label>
    <input id="token" type="password" placeholder="cole o código definido no servidor"/>
  </div>

  <div class="card">
    <div class="row">
      <div>
        <label>Nome do parceiro</label>
        <input id="label" placeholder="ex.: Dra. Ana — nutricionista"/>
      </div>
      <button onclick="createKey()">Gerar chave</button>
    </div>
    <div id="created"></div>
    <div id="createErr" class="err"></div>
  </div>

  <div class="card">
    <div class="row" style="align-items:center; margin-bottom:8px;">
      <div><label style="margin:0">Chaves emitidas</label></div>
      <button class="ghost" onclick="loadKeys()">Atualizar</button>
    </div>
    <table>
      <thead><tr><th>Parceiro</th><th>Final</th><th>Criada em</th><th>Situação</th><th></th></tr></thead>
      <tbody id="rows"><tr><td colspan="5" style="color:#64748B">Informe o código e clique em Atualizar.</td></tr></tbody>
    </table>
    <div id="listErr" class="err"></div>
  </div>

<script>
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
        '<tr><td>' + esc(k.label) + '</td><td>…' + esc(k.hint) + '</td><td>' + esc(fmtDate(k.createdAt)) + '</td>' +
        '<td>' + (k.revokedAt ? '<span class="tag off">revogada</span>' : '<span class="tag on">ativa</span>') + '</td>' +
        '<td>' + (k.revokedAt ? '' : '<button class="danger" onclick="revoke(\\'' + esc(k.id) + '\\')">Revogar</button>') + '</td></tr>'
      ).join('');
      document.getElementById('rows').innerHTML =
        rows || '<tr><td colspan="5" style="color:#64748B">Nenhuma chave emitida ainda.</td></tr>';
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
