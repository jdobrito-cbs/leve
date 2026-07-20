/** Painel do dono em /painel. Login com usuário e senha + 2FA obrigatório
 *  (app autenticador), com cadastro do master no primeiro acesso e gestão de
 *  administradores e chaves de parceiro. Mesmo visual do site (modo escuro por
 *  padrão). Segurança: esc() antes de qualquer innerHTML (anti-XSS) e sessão em
 *  cookie httpOnly no servidor — o navegador não guarda senha nem token. */
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
    --blue:#4F8DF6; --blue-2:#6EA2F8; --green:#3BD8A0; --red:#F87171; --amber:#F5B759;
    --glow:rgba(79,141,246,.30); --r:16px;
  }
  :root.light{
    --bg:#F5F8FF; --bg2:#FFFFFF; --surface:#FFFFFF; --surface2:#EEF4FF;
    --ink:#0E1B2E; --muted:#51617C; --faint:#8393AD; --line:#E1EAF6;
    --blue:#2563EB; --blue-2:#1D4ED8; --green:#15803D; --red:#DC2626; --amber:#B45309;
    --glow:rgba(37,99,235,.16);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--bg);color:var(--ink);min-height:100vh;
    font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
  .mono{font-family:ui-monospace,"Cascadia Code",Consolas,monospace}
  .wrap{max-width:820px;margin:0 auto;padding:0 20px 60px}
  .narrow{max-width:460px}
  :focus-visible{outline:2.5px solid var(--blue);outline-offset:3px;border-radius:6px}
  header{display:flex;align-items:center;gap:12px;padding:22px 0 6px;flex-wrap:wrap}
  .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:19px}
  .brand svg{width:30px;height:30px;display:block}
  .spacer{flex:1}
  .who{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px}
  .icobtn{width:40px;height:40px;border-radius:11px;border:1px solid var(--line);
    background:var(--surface);color:var(--ink);display:grid;place-items:center;cursor:pointer;transition:.2s}
  .icobtn:hover{border-color:var(--blue);color:var(--blue)}
  h1{font-size:22px;font-weight:800;margin-top:14px} h1 b{color:var(--blue)}
  h2{font-size:15px;font-weight:800;margin:0}
  p.lead{color:var(--muted);font-size:14px;margin:6px 0 22px;max-width:64ch}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:20px;margin-bottom:16px}
  label{font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:6px}
  input{width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:11px;font-size:15px;
    background:var(--bg2);color:var(--ink);transition:border-color .2s}
  input::placeholder{color:var(--faint)}
  input:focus{outline:none;border-color:var(--blue)}
  .field{margin-bottom:12px}
  .btn{background:var(--blue);color:#fff;border:0;border-radius:11px;padding:11px 18px;font-size:14px;
    font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .2s;white-space:nowrap}
  .btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px -12px var(--glow)}
  .btn[disabled]{opacity:.55;cursor:default;transform:none;box-shadow:none}
  .btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line);box-shadow:none}
  .btn.ghost:hover{border-color:var(--blue);color:var(--blue);transform:none}
  .btn.danger{background:color-mix(in srgb,var(--red) 16%,transparent);color:var(--red);padding:7px 12px;font-size:12.5px}
  .btn.danger:hover{background:color-mix(in srgb,var(--red) 24%,transparent);transform:none;box-shadow:none}
  .btn.mini{padding:7px 12px;font-size:12.5px}
  .btn.block{width:100%;text-align:center}
  .row{display:flex;gap:12px;align-items:flex-end}
  .row>div{flex:1}
  .between{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
  .muted{color:var(--muted);font-size:13px}
  .faint{color:var(--faint);font-size:12px}
  .center{text-align:center}
  .link{color:var(--blue);background:none;border:0;cursor:pointer;font-size:13px;padding:0;font-weight:600}
  .link:hover{text-decoration:underline}
  .newkey{background:color-mix(in srgb,var(--blue) 12%,var(--surface));border:1px dashed var(--blue);
    border-radius:12px;padding:16px;margin-top:14px;font-size:19px;font-weight:800;letter-spacing:1.5px;
    text-align:center;color:var(--blue);user-select:all}
  .secretbox{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:14px;
    text-align:center;font-size:17px;font-weight:700;letter-spacing:2px;user-select:all;word-break:break-all}
  .qrbox{background:#fff;border-radius:14px;padding:12px;width:max-content;margin:2px auto 10px;line-height:0}
  .qrbox img{display:block;width:200px;height:200px;image-rendering:pixelated}
  .codes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
  .codes span{background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:9px;
    text-align:center;font-size:15px;letter-spacing:1px;user-select:all}
  .hintnote{font-size:12.5px;color:var(--muted);margin-top:8px;text-align:center}
  .err{color:var(--red);font-size:13px;margin-top:10px;min-height:1px}
  .ok{color:var(--green);font-size:13px;margin-top:10px;min-height:1px}
  .tblwrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{text-align:left;padding:11px 8px;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:middle}
  th{color:var(--muted);font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em}
  tr:last-child td{border-bottom:0}
  td .actions{display:flex;gap:6px;justify-content:flex-end}
  .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;display:inline-block}
  .badge.master{background:color-mix(in srgb,var(--blue) 18%,transparent);color:var(--blue)}
  .badge.admin{background:color-mix(in srgb,var(--faint) 22%,transparent);color:var(--muted)}
  .badge.on,.badge.free{background:color-mix(in srgb,var(--green) 16%,transparent);color:var(--green)}
  .badge.off,.badge.bound{background:color-mix(in srgb,var(--amber) 20%,transparent);color:var(--amber)}
  .empty{color:var(--faint);text-align:center;padding:18px}
  .divider{height:1px;background:var(--line);margin:20px 0}
  .steps{counter-reset:s;margin:0 0 14px;padding:0;list-style:none;color:var(--muted);font-size:13px}
  .steps li{counter-increment:s;position:relative;padding:4px 0 4px 26px}
  .steps li::before{content:counter(s);position:absolute;left:0;top:3px;width:18px;height:18px;border-radius:50%;
    background:var(--blue);color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center}
  footer{color:var(--faint);font-size:12px;text-align:center;margin-top:24px}
  .hidden{display:none!important}
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
      <div class="spacer"></div>
      <div class="who hidden" id="who"><span id="whoName"></span><button class="link" id="logout">Sair</button></div>
      <button class="icobtn" id="theme" aria-label="Alternar modo claro e escuro">
        <svg id="ic-moon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg id="ic-sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </header>

    <div id="s-loading" class="center muted" style="padding:60px 0">Carregando…</div>

    <div id="s-setup" class="hidden narrow" style="margin:0 auto">
      <h1><b>Primeiro acesso</b></h1>
      <p class="lead">Crie o administrador principal (master). Isto só aparece uma vez.</p>
      <div class="card">
        <div class="field">
          <label for="su-token">Código do servidor (ADMIN_TOKEN)</label>
          <input id="su-token" type="password" autocomplete="off" placeholder="o código do .env do servidor"/>
        </div>
        <div class="field">
          <label for="su-user">Usuário</label>
          <input id="su-user" autocomplete="username" placeholder="ex.: jorge"/>
        </div>
        <div class="field">
          <label for="su-pass">Senha (mínimo 8 caracteres)</label>
          <input id="su-pass" type="password" autocomplete="new-password" placeholder="senha forte"/>
        </div>
        <button class="btn block" id="su-go">Criar master e configurar 2FA</button>
        <div id="su-err" class="err"></div>
      </div>
    </div>

    <div id="s-login" class="hidden narrow" style="margin:0 auto">
      <h1><b>Entrar</b> no painel</h1>
      <p class="lead">Acesso restrito ao dono e administradores.</p>
      <div class="card">
        <div class="field">
          <label for="li-user">Usuário</label>
          <input id="li-user" autocomplete="username" placeholder="usuário"/>
        </div>
        <div class="field">
          <label for="li-pass">Senha</label>
          <input id="li-pass" type="password" autocomplete="current-password" placeholder="senha"/>
        </div>
        <div class="field" id="li-codeWrap">
          <label for="li-code">Código do app autenticador (6 dígitos)</label>
          <input id="li-code" inputmode="numeric" autocomplete="one-time-code" placeholder="000000"/>
          <div class="faint" style="margin-top:6px">No primeiro acesso, deixe em branco para configurar o 2FA.</div>
        </div>
        <div class="field hidden" id="li-backupWrap">
          <label for="li-backup">Código de backup</label>
          <input id="li-backup" placeholder="XXXX-XXXX"/>
        </div>
        <button class="btn block" id="li-go">Entrar</button>
        <div class="center" style="margin-top:12px">
          <button class="link" id="li-toggleBackup">Usar um código de backup</button>
        </div>
        <div id="li-err" class="err"></div>
      </div>
    </div>

    <div id="s-enroll" class="hidden narrow" style="margin:0 auto">
      <h1><b>Ativar</b> verificação em duas etapas</h1>
      <p class="lead">Obrigatória para todos. Você vai precisar de um app autenticador (Google Authenticator, Authy, etc.).</p>
      <div class="card">
        <ol class="steps">
          <li>Abra seu app autenticador (Google Authenticator, Authy, etc.).</li>
          <li>Escaneie o QR code abaixo — ou adicione manualmente com a chave.</li>
          <li>Digite o código de 6 dígitos que aparecer para confirmar.</li>
        </ol>
        <div class="qrbox"><img id="en-qr" alt="QR code para o app autenticador" width="200" height="200"/></div>
        <div class="center faint" style="margin:2px 0 8px">ou digite esta chave no app</div>
        <div class="secretbox mono" id="en-secret">…</div>
        <div class="center" style="margin:10px 0 16px"><a class="link" id="en-link" href="#">Abrir no app autenticador</a></div>
        <div class="field">
          <label for="en-code">Código de 6 dígitos</label>
          <input id="en-code" inputmode="numeric" autocomplete="one-time-code" placeholder="000000"/>
        </div>
        <button class="btn block" id="en-go">Confirmar e ativar</button>
        <div id="en-err" class="err"></div>
      </div>
    </div>

    <div id="s-backup" class="hidden narrow" style="margin:0 auto">
      <h1><b>Guarde</b> seus códigos de backup</h1>
      <p class="lead">Use um destes se perder o app autenticador. Cada código funciona uma vez. Eles não serão mostrados de novo.</p>
      <div class="card">
        <div class="codes mono" id="bk-codes"></div>
        <button class="btn block" id="bk-go">Guardei em local seguro — continuar</button>
      </div>
    </div>

    <div id="s-dash" class="hidden">
      <h1><b>Painel</b> de parceiros</h1>

      <div class="card">
        <div class="between">
          <h2>Sua conta</h2>
          <span id="dash-role"></span>
        </div>
        <div class="muted" id="dash-me" style="margin-bottom:12px"></div>
        <button class="link" id="pw-toggle">Trocar minha senha</button>
        <div id="pw-form" class="hidden" style="margin-top:12px">
          <div class="field"><label for="pw-cur">Senha atual</label><input id="pw-cur" type="password" autocomplete="current-password"/></div>
          <div class="field"><label for="pw-new">Nova senha (mínimo 8)</label><input id="pw-new" type="password" autocomplete="new-password"/></div>
          <button class="btn mini" id="pw-go">Salvar nova senha</button>
          <div id="pw-msg" class="err"></div>
        </div>
      </div>

      <div class="card">
        <div class="between">
          <h2>Chaves de parceiro</h2>
          <button class="btn ghost mini" id="k-reload">Atualizar</button>
        </div>
        <div class="row">
          <div>
            <label for="k-label">Nome do parceiro</label>
            <input id="k-label" placeholder="ex.: Dra. Ana — nutricionista"/>
          </div>
          <button class="btn" id="k-create">Gerar chave</button>
        </div>
        <div id="k-new"></div>
        <div id="k-err" class="err"></div>
        <div class="divider"></div>
        <div class="tblwrap"><table>
          <thead><tr><th>Parceiro</th><th>Final</th><th>Criada</th><th>Situação</th><th>Aparelho</th><th></th></tr></thead>
          <tbody id="k-rows"><tr><td colspan="6" class="empty">Carregando…</td></tr></tbody>
        </table></div>
      </div>

      <div class="card">
        <div class="between">
          <h2>Administradores</h2>
          <button class="btn ghost mini" id="a-reload">Atualizar</button>
        </div>
        <div id="a-createWrap" class="hidden">
          <div class="row">
            <div><label for="a-user">Usuário</label><input id="a-user" placeholder="usuário do novo admin"/></div>
            <div><label for="a-pass">Senha inicial</label><input id="a-pass" type="password" placeholder="mínimo 8"/></div>
            <button class="btn" id="a-create">Cadastrar</button>
          </div>
          <div class="faint" style="margin-top:6px">O novo admin configura o 2FA no primeiro acesso.</div>
          <div id="a-err" class="err"></div>
          <div class="divider"></div>
        </div>
        <div class="tblwrap"><table>
          <thead><tr><th>Usuário</th><th>Papel</th><th>2FA</th><th>Criado</th><th></th></tr></thead>
          <tbody id="a-rows"><tr><td colspan="5" class="empty">Carregando…</td></tr></tbody>
        </table></div>
      </div>
    </div>

    <footer>Área restrita · www.levemobile.com.br/painel</footer>
  </div>

<script>
  (function(){
    var root=document.documentElement, saved=null;
    try{saved=localStorage.getItem('leve-theme')}catch(e){}
    if(saved==='light')root.classList.add('light');
    function sync(){var l=root.classList.contains('light');
      document.getElementById('ic-moon').style.display=l?'none':'block';
      document.getElementById('ic-sun').style.display=l?'block':'none';}
    sync();
    document.getElementById('theme').addEventListener('click',function(){
      root.classList.toggle('light');
      try{localStorage.setItem('leve-theme',root.classList.contains('light')?'light':'dark')}catch(e){}
      sync();
    });
  })();

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function $(id){return document.getElementById(id);}
  function fmt(iso){var d=new Date(iso);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}

  function api(path,method,body){
    return fetch(path,{method:method||'GET',credentials:'same-origin',
      headers:{'content-type':'application/json'},
      body:body?JSON.stringify(body):undefined}).then(function(r){
        return r.text().then(function(t){var j=null;try{j=t?JSON.parse(t):null;}catch(e){}return {status:r.status,ok:r.ok,json:j};});
      });
  }

  var SCREENS=['s-loading','s-setup','s-login','s-enroll','s-backup','s-dash'];
  function show(id){SCREENS.forEach(function(s){$(s).classList.toggle('hidden',s!==id);});
    $('who').classList.toggle('hidden',id!=='s-dash');}

  function boot(){
    show('s-loading');
    api('/admin/setup-state').then(function(r){
      if(r.json&&r.json.needsSetup){show('s-setup');$('su-token').focus();return;}
      api('/admin/me').then(function(m){
        if(m.status===401){show('s-login');$('li-user').focus();return;}
        if(m.json&&m.json.needEnroll){startEnroll();return;}
        openDash(m.json);
      });
    }).catch(function(){show('s-login');});
  }

  $('su-go').addEventListener('click',function(){
    $('su-err').textContent='';
    var token=$('su-token').value.trim(),user=$('su-user').value.trim(),pass=$('su-pass').value;
    if(!token||!user||!pass){$('su-err').textContent='preencha todos os campos';return;}
    api('/admin/setup','POST',{adminToken:token,username:user,password:pass}).then(function(r){
      if(!r.ok){$('su-err').textContent=(r.json&&r.json.error)||'não foi possível criar';return;}
      startEnroll();
    });
  });

  var usingBackup=false;
  $('li-toggleBackup').addEventListener('click',function(){
    usingBackup=!usingBackup;
    $('li-codeWrap').classList.toggle('hidden',usingBackup);
    $('li-backupWrap').classList.toggle('hidden',!usingBackup);
    $('li-toggleBackup').textContent=usingBackup?'Usar o código do app':'Usar um código de backup';
  });
  function doLogin(){
    $('li-err').textContent='';
    var body={username:$('li-user').value.trim(),password:$('li-pass').value};
    if(usingBackup){var b=$('li-backup').value.trim();if(b)body.backupCode=b;}
    else{var c=$('li-code').value.trim();if(c)body.code=c;}
    if(!body.username||!body.password){$('li-err').textContent='informe usuário e senha';return;}
    api('/admin/login','POST',body).then(function(r){
      if(r.json&&r.json.needEnroll){startEnroll();return;}
      if(!r.ok){$('li-err').textContent=(r.json&&r.json.error)||'não foi possível entrar';return;}
      boot();
    });
  }
  $('li-go').addEventListener('click',doLogin);
  ['li-pass','li-code','li-backup'].forEach(function(id){
    $(id).addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  });

  function startEnroll(){
    show('s-enroll');
    api('/admin/2fa/setup','POST').then(function(r){
      if(!r.ok){$('en-err').textContent=(r.json&&r.json.error)||'erro ao iniciar';return;}
      $('en-secret').textContent=(r.json.secret||'').replace(/(.{4})/g,'$1 ').trim();
      if(r.json.qr)$('en-qr').src=r.json.qr;
      $('en-link').setAttribute('href',r.json.otpauthUrl||'#');
      $('en-code').focus();
    });
  }
  function doConfirm(){
    $('en-err').textContent='';
    var code=$('en-code').value.trim();
    if(!code){$('en-err').textContent='digite o código de 6 dígitos';return;}
    api('/admin/2fa/confirm','POST',{code:code}).then(function(r){
      if(!r.ok){$('en-err').textContent=(r.json&&r.json.error)||'código incorreto';return;}
      var codes=(r.json&&r.json.backupCodes)||[];
      $('bk-codes').innerHTML=codes.map(function(c){return '<span>'+esc(c)+'</span>';}).join('');
      show('s-backup');
    });
  }
  $('en-go').addEventListener('click',doConfirm);
  $('en-code').addEventListener('keydown',function(e){if(e.key==='Enter')doConfirm();});
  $('bk-go').addEventListener('click',function(){boot();});

  var me=null;
  function openDash(info){
    me=info;show('s-dash');
    $('whoName').textContent=info.username;
    $('dash-me').textContent='Conectado como '+info.username;
    $('dash-role').innerHTML=info.role==='master'?'<span class="badge master">master</span>':'<span class="badge admin">admin</span>';
    $('a-createWrap').classList.toggle('hidden',info.role!=='master');
    loadKeys();loadAdmins();
  }

  function loadKeys(){
    $('k-err').textContent='';
    api('/partner-keys').then(function(r){
      if(!r.ok){$('k-rows').innerHTML='<tr><td colspan="6" class="empty">sessão expirada</td></tr>';return;}
      var rows=(r.json||[]).map(function(k){
        var sit=k.revokedAt?'<span class="badge off">revogada</span>':'<span class="badge on">ativa</span>';
        var dev=k.revokedAt?'—':(k.bound?'<span class="badge bound">vinculada</span>':'<span class="badge free">livre</span>');
        var act='';
        if(!k.revokedAt){
          if(k.bound)act+='<button class="btn ghost mini" data-act="unbind" data-id="'+esc(k.id)+'">Desvincular</button>';
          act+='<button class="btn danger" data-act="revoke" data-id="'+esc(k.id)+'">Revogar</button>';
        }
        return '<tr><td>'+esc(k.label)+'</td><td class="mono">…'+esc(k.hint)+'</td><td class="mono">'+esc(fmt(k.createdAt))+
          '</td><td>'+sit+'</td><td>'+dev+'</td><td><div class="actions">'+act+'</div></td></tr>';
      }).join('');
      $('k-rows').innerHTML=rows||'<tr><td colspan="6" class="empty">Nenhuma chave emitida ainda.</td></tr>';
    });
  }
  $('k-reload').addEventListener('click',loadKeys);
  $('k-create').addEventListener('click',function(){
    $('k-err').textContent='';$('k-new').innerHTML='';
    var label=$('k-label').value.trim();
    if(!label){$('k-err').textContent='informe o nome do parceiro';return;}
    api('/partner-keys','POST',{label:label}).then(function(r){
      if(!r.ok){$('k-err').textContent=(r.json&&r.json.error)||'não foi possível gerar';return;}
      $('k-new').innerHTML='<div class="newkey">'+esc(r.json.key)+'</div><div class="hintnote">Chave de '+esc(r.json.label)+' — copie e envie agora; ela não será exibida de novo.</div>';
      $('k-label').value='';loadKeys();
    });
  });
  $('k-rows').addEventListener('click',function(e){
    var b=e.target.closest('button[data-act]');if(!b)return;
    var id=b.getAttribute('data-id'),act=b.getAttribute('data-act');
    if(act==='revoke'){
      if(!confirm('Revogar esta chave? O parceiro perde o acesso premium na próxima verificação.'))return;
      api('/partner-keys/'+id+'/revoke','POST').then(loadKeys);
    }else if(act==='unbind'){
      if(!confirm('Desvincular do aparelho atual? O parceiro poderá usar a chave em outro dispositivo.'))return;
      api('/partner-keys/'+id+'/unbind','POST').then(loadKeys);
    }
  });

  function loadAdmins(){
    $('a-err').textContent='';
    api('/admin/list').then(function(r){
      if(!r.ok){$('a-rows').innerHTML='<tr><td colspan="5" class="empty">sessão expirada</td></tr>';return;}
      var isMaster=me&&me.role==='master';
      var rows=(r.json||[]).map(function(a){
        var role=a.role==='master'?'<span class="badge master">master</span>':'<span class="badge admin">admin</span>';
        var tfa=a.totpEnabled?'<span class="badge on">ativo</span>':'<span class="badge off">pendente</span>';
        var act='';
        var canPw=!a.isSelf && (isMaster || a.role!=='master');
        if(canPw)act+='<button class="btn ghost mini" data-act="pw" data-id="'+esc(a.id)+'" data-name="'+esc(a.username)+'">Redefinir senha</button>';
        if(isMaster && !a.isSelf){
          if(a.totpEnabled)act+='<button class="btn ghost mini" data-act="r2fa" data-id="'+esc(a.id)+'" data-name="'+esc(a.username)+'">Resetar 2FA</button>';
          if(a.role!=='master')act+='<button class="btn danger" data-act="del" data-id="'+esc(a.id)+'" data-name="'+esc(a.username)+'">Excluir</button>';
        }
        return '<tr><td>'+esc(a.username)+(a.isSelf?' <span class="faint">(você)</span>':'')+'</td><td>'+role+'</td><td>'+tfa+
          '</td><td class="mono">'+esc(fmt(a.createdAt))+'</td><td><div class="actions">'+(act||'<span class="faint">—</span>')+'</div></td></tr>';
      }).join('');
      $('a-rows').innerHTML=rows||'<tr><td colspan="5" class="empty">Nenhum administrador.</td></tr>';
    });
  }
  $('a-reload').addEventListener('click',loadAdmins);
  $('a-create').addEventListener('click',function(){
    $('a-err').textContent='';
    var u=$('a-user').value.trim(),p=$('a-pass').value;
    if(!u||!p){$('a-err').textContent='informe usuário e senha';return;}
    api('/admin','POST',{username:u,password:p}).then(function(r){
      if(!r.ok){$('a-err').textContent=(r.json&&r.json.error)||'não foi possível cadastrar';return;}
      $('a-user').value='';$('a-pass').value='';loadAdmins();
    });
  });
  $('a-rows').addEventListener('click',function(e){
    var b=e.target.closest('button[data-act]');if(!b)return;
    var id=b.getAttribute('data-id'),name=b.getAttribute('data-name'),act=b.getAttribute('data-act');
    if(act==='pw'){
      var np=prompt('Nova senha para "'+name+'" (mínimo 8 caracteres):');
      if(!np)return;
      if(np.length<8){alert('a senha precisa de pelo menos 8 caracteres');return;}
      api('/admin/'+id+'/password','POST',{newPassword:np}).then(function(r){
        if(!r.ok)alert((r.json&&r.json.error)||'não foi possível redefinir');
        else alert('senha redefinida — envie a nova senha para '+name);
        loadAdmins();
      });
    }else if(act==='r2fa'){
      if(!confirm('Resetar o 2FA de "'+name+'"? Ele terá que configurar de novo no próximo acesso.'))return;
      api('/admin/'+id+'/reset-2fa','POST').then(loadAdmins);
    }else if(act==='del'){
      if(!confirm('Excluir o administrador "'+name+'"? Esta ação não pode ser desfeita.'))return;
      api('/admin/'+id,'DELETE').then(loadAdmins);
    }
  });

  $('pw-toggle').addEventListener('click',function(){$('pw-form').classList.toggle('hidden');});
  $('pw-go').addEventListener('click',function(){
    $('pw-msg').className='err';$('pw-msg').textContent='';
    var cur=$('pw-cur').value,nw=$('pw-new').value;
    if(!cur||!nw){$('pw-msg').textContent='preencha os dois campos';return;}
    if(nw.length<8){$('pw-msg').textContent='a nova senha precisa de pelo menos 8 caracteres';return;}
    api('/admin/password','POST',{currentPassword:cur,newPassword:nw}).then(function(r){
      if(!r.ok){$('pw-msg').textContent=(r.json&&r.json.error)||'não foi possível trocar';return;}
      $('pw-cur').value='';$('pw-new').value='';
      $('pw-msg').className='ok';$('pw-msg').textContent='senha atualizada.';
    });
  });

  $('logout').addEventListener('click',function(){api('/admin/logout','POST').then(function(){boot();});});

  boot();
</script>
</body>
</html>`;
