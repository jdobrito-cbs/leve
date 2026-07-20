import type { FastifyInstance } from 'fastify';
import { describe, expect, it } from 'vitest';
import { buildServer } from './server.js';
import { totpAt } from './adminAuth.js';
import { MemoryStore } from './store.js';

const ADMIN_TOKEN = 'token-do-servidor-bem-longo-1234';
const hub = async () => '{"foods":[]}';

function makeApp() {
  const store = new MemoryStore();
  return buildServer({ callHub: hub, partnerStore: store, adminStore: store, adminToken: ADMIN_TOKEN });
}

// Extrai o cookie de sessão da resposta do inject.
function cookieOf(res: { cookies: Array<{ name: string; value: string }> }): string {
  const c = res.cookies.find((x) => x.name === 'leve_admin');
  return c ? 'leve_admin=' + c.value : '';
}

// Cria o master e configura o 2FA; devolve o cookie com sessão completa.
async function bootstrapMaster(app: FastifyInstance, username = 'jorge') {
  const setup = await app.inject({
    method: 'POST',
    url: '/admin/setup',
    payload: { adminToken: ADMIN_TOKEN, username, password: 'senha-super-forte' },
  });
  let cookie = cookieOf(setup);
  const s = await app.inject({ method: 'POST', url: '/admin/2fa/setup', headers: { cookie } });
  const secret = s.json().secret as string;
  const confirm = await app.inject({
    method: 'POST',
    url: '/admin/2fa/confirm',
    headers: { cookie },
    payload: { code: totpAt(secret, Date.now()) },
  });
  cookie = cookieOf(confirm);
  return { cookie, secret, backupCodes: confirm.json().backupCodes as string[] };
}

// Cria um admin comum (pelo master) e configura o 2FA dele.
async function addAdmin(app: FastifyInstance, masterCookie: string, username: string) {
  await app.inject({
    method: 'POST',
    url: '/admin',
    headers: { cookie: masterCookie },
    payload: { username, password: 'senha-do-admin-1' },
  });
  const li = await app.inject({
    method: 'POST',
    url: '/admin/login',
    payload: { username, password: 'senha-do-admin-1' },
  });
  let cookie = cookieOf(li);
  const s = await app.inject({ method: 'POST', url: '/admin/2fa/setup', headers: { cookie } });
  const secret = s.json().secret as string;
  const confirm = await app.inject({
    method: 'POST',
    url: '/admin/2fa/confirm',
    headers: { cookie },
    payload: { code: totpAt(secret, Date.now()) },
  });
  return { cookie: cookieOf(confirm), secret };
}

async function idOf(app: FastifyInstance, cookie: string, username: string) {
  const list = await app.inject({ method: 'GET', url: '/admin/list', headers: { cookie } });
  const found = (list.json() as Array<{ id: string; username: string }>).find(
    (a) => a.username === username,
  );
  return found?.id ?? '';
}

describe('cookie de sessão: Secure acompanha o protocolo', () => {
  it('sem HTTPS o cookie sai sem Secure; com proxy HTTPS sai com Secure', async () => {
    const store = new MemoryStore();
    const app = await buildServer({
      callHub: hub,
      partnerStore: store,
      adminStore: store,
      adminToken: ADMIN_TOKEN,
      trustProxy: true,
    });
    const setup = await app.inject({
      method: 'POST',
      url: '/admin/setup',
      payload: { adminToken: ADMIN_TOKEN, username: 'jorge', password: 'senha-super-forte' },
    });
    // inject simula http puro → sem Secure (senão o navegador descarta).
    const raw = String(setup.headers['set-cookie']);
    expect(raw).toContain('leve_admin=');
    expect(raw).not.toContain('Secure');

    const login = await app.inject({
      method: 'POST',
      url: '/admin/login',
      headers: { 'x-forwarded-proto': 'https' },
      payload: { username: 'jorge', password: 'senha-super-forte' },
    });
    expect(String(login.headers['set-cookie'])).toContain('Secure');
  });
});

describe('cadastro inicial e 2FA', () => {
  it('setup-state indica cadastro só até existir o master', async () => {
    const app = await makeApp();
    const before = await app.inject({ method: 'GET', url: '/admin/setup-state' });
    expect(before.json()).toEqual({ needsSetup: true });
    await bootstrapMaster(app);
    const after = await app.inject({ method: 'GET', url: '/admin/setup-state' });
    expect(after.json()).toEqual({ needsSetup: false });
  });

  it('setup exige o ADMIN_TOKEN e não roda duas vezes', async () => {
    const app = await makeApp();
    const wrong = await app.inject({
      method: 'POST',
      url: '/admin/setup',
      payload: { adminToken: 'errado', username: 'jorge', password: 'senha-super-forte' },
    });
    expect(wrong.statusCode).toBe(401);
    await bootstrapMaster(app);
    const again = await app.inject({
      method: 'POST',
      url: '/admin/setup',
      payload: { adminToken: ADMIN_TOKEN, username: 'outro', password: 'senha-super-forte' },
    });
    expect(again.statusCode).toBe(409);
  });

  it('após configurar o 2FA, o master acessa a lista', async () => {
    const app = await makeApp();
    const { cookie, backupCodes } = await bootstrapMaster(app);
    expect(backupCodes).toHaveLength(8);
    const list = await app.inject({ method: 'GET', url: '/admin/list', headers: { cookie } });
    expect(list.statusCode).toBe(200);
    const rows = list.json() as Array<{ role: string; totpEnabled: boolean }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe('master');
    expect(rows[0].totpEnabled).toBe(true);
  });
});

describe('login com 2FA', () => {
  it('exige senha e código; recusa código errado', async () => {
    const app = await makeApp();
    const { secret } = await bootstrapMaster(app);

    const noCode = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'jorge', password: 'senha-super-forte' },
    });
    expect(noCode.statusCode).toBe(401);
    expect(noCode.json().need2fa).toBe(true);

    const badCode = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'jorge', password: 'senha-super-forte', code: '000000' },
    });
    expect(badCode.statusCode).toBe(401);

    const ok = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'jorge', password: 'senha-super-forte', code: totpAt(secret, Date.now()) },
    });
    expect(ok.statusCode).toBe(200);
    expect(cookieOf(ok)).toContain('leve_admin=');
  });

  it('senha errada não autentica e bloqueia após muitas tentativas', async () => {
    const app = await makeApp();
    const { secret } = await bootstrapMaster(app);
    for (let i = 0; i < 5; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/admin/login',
        payload: { username: 'jorge', password: 'errada', code: '000000' },
      });
      expect(r.statusCode).toBe(401);
    }
    // Bloqueado: mesmo com a senha e o código certos, recusa por um tempo.
    const locked = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'jorge', password: 'senha-super-forte', code: totpAt(secret, Date.now()) },
    });
    expect(locked.statusCode).toBe(429);
  });

  it('código de backup entra e não serve duas vezes', async () => {
    const app = await makeApp();
    const { backupCodes } = await bootstrapMaster(app);
    const first = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'jorge', password: 'senha-super-forte', backupCode: backupCodes[0] },
    });
    expect(first.statusCode).toBe(200);
    const reuse = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'jorge', password: 'senha-super-forte', backupCode: backupCodes[0] },
    });
    expect(reuse.statusCode).toBe(401);
  });
});

describe('matriz de permissões', () => {
  it('master cria/exclui e reseta; admin comum não', async () => {
    const app = await makeApp();
    const master = await bootstrapMaster(app);
    const admin = await addAdmin(app, master.cookie, 'ana');
    const adminId = await idOf(app, master.cookie, 'ana');
    const masterId = await idOf(app, master.cookie, 'jorge');

    // admin comum não cadastra nem exclui
    const create = await app.inject({
      method: 'POST',
      url: '/admin',
      headers: { cookie: admin.cookie },
      payload: { username: 'novo', password: 'senha-do-admin-1' },
    });
    expect(create.statusCode).toBe(403);
    const del = await app.inject({
      method: 'DELETE',
      url: '/admin/' + masterId,
      headers: { cookie: admin.cookie },
    });
    expect(del.statusCode).toBe(403);

    // admin comum não troca a senha do master
    const pwMaster = await app.inject({
      method: 'POST',
      url: '/admin/' + masterId + '/password',
      headers: { cookie: admin.cookie },
      payload: { newPassword: 'nova-senha-forte' },
    });
    expect(pwMaster.statusCode).toBe(403);

    // master não pode ser excluído
    const delMaster = await app.inject({
      method: 'DELETE',
      url: '/admin/' + masterId,
      headers: { cookie: master.cookie },
    });
    expect(delMaster.statusCode).toBe(403);

    // master exclui o admin comum
    const delAdmin = await app.inject({
      method: 'DELETE',
      url: '/admin/' + adminId,
      headers: { cookie: master.cookie },
    });
    expect(delAdmin.statusCode).toBe(200);
  });

  it('admin comum redefine a senha de outro admin comum', async () => {
    const app = await makeApp();
    const master = await bootstrapMaster(app);
    const ana = await addAdmin(app, master.cookie, 'ana');
    const bia = await addAdmin(app, master.cookie, 'bia');
    const biaId = await idOf(app, master.cookie, 'bia');

    const reset = await app.inject({
      method: 'POST',
      url: '/admin/' + biaId + '/password',
      headers: { cookie: ana.cookie },
      payload: { newPassword: 'senha-nova-da-bia-1' },
    });
    expect(reset.statusCode).toBe(200);

    // A nova senha vale (o 2FA da bia continua ativo → precisa do código).
    const login = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: {
        username: 'bia',
        password: 'senha-nova-da-bia-1',
        code: totpAt(bia.secret, Date.now()),
      },
    });
    expect(login.statusCode).toBe(200);
  });

  it('trocar a própria senha invalida a sessão antiga', async () => {
    const app = await makeApp();
    const master = await bootstrapMaster(app);
    const change = await app.inject({
      method: 'POST',
      url: '/admin/password',
      headers: { cookie: master.cookie },
      payload: { currentPassword: 'senha-super-forte', newPassword: 'outra-senha-forte' },
    });
    expect(change.statusCode).toBe(200);
    const fresh = cookieOf(change); // cookie renovado
    // O cookie antigo não vale mais; o novo sim.
    const oldSession = await app.inject({
      method: 'GET',
      url: '/admin/list',
      headers: { cookie: master.cookie },
    });
    expect(oldSession.statusCode).toBe(401);
    const newSession = await app.inject({ method: 'GET', url: '/admin/list', headers: { cookie: fresh } });
    expect(newSession.statusCode).toBe(200);
  });
});

describe('chave de parceiro: trava de 1 aparelho', () => {
  it('prende no primeiro aparelho, recusa outro e libera ao desvincular', async () => {
    const app = await makeApp();
    const master = await bootstrapMaster(app);
    const created = await app.inject({
      method: 'POST',
      url: '/partner-keys',
      headers: { cookie: master.cookie },
      payload: { label: 'Dra. Ana' },
    });
    const { id, key } = created.json() as { id: string; key: string };

    const a = await app.inject({
      method: 'POST',
      url: '/partner-keys/validate',
      payload: { key, deviceId: 'aparelho-A-1234' },
    });
    expect(a.json()).toEqual({ valid: true, label: 'Dra. Ana' });

    const b = await app.inject({
      method: 'POST',
      url: '/partner-keys/validate',
      payload: { key, deviceId: 'aparelho-B-5678' },
    });
    expect(b.json()).toEqual({ valid: false, reason: 'bound_elsewhere' });

    // A lista mostra a chave como vinculada.
    const list = await app.inject({
      method: 'GET',
      url: '/partner-keys',
      headers: { cookie: master.cookie },
    });
    expect((list.json() as Array<{ bound: boolean }>)[0].bound).toBe(true);

    const unbind = await app.inject({
      method: 'POST',
      url: '/partner-keys/' + id + '/unbind',
      headers: { cookie: master.cookie },
    });
    expect(unbind.statusCode).toBe(200);

    // Agora o aparelho B consegue vincular.
    const b2 = await app.inject({
      method: 'POST',
      url: '/partner-keys/validate',
      payload: { key, deviceId: 'aparelho-B-5678' },
    });
    expect(b2.json()).toEqual({ valid: true, label: 'Dra. Ana' });
  });
});

describe('recuperação (chave-mestra)', () => {
  it('redefine a senha do master e zera o 2FA com o ADMIN_TOKEN', async () => {
    const app = await makeApp();
    await bootstrapMaster(app);
    const bad = await app.inject({
      method: 'POST',
      url: '/admin/recover',
      payload: { adminToken: 'errado', newPassword: 'nova-senha-de-recuperacao' },
    });
    expect(bad.statusCode).toBe(401);

    const ok = await app.inject({
      method: 'POST',
      url: '/admin/recover',
      payload: { adminToken: ADMIN_TOKEN, newPassword: 'nova-senha-de-recuperacao' },
    });
    expect(ok.statusCode).toBe(200);

    // Após recuperar, a nova senha entra e o 2FA volta a ser configurado.
    const login = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { username: 'jorge', password: 'nova-senha-de-recuperacao' },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().needEnroll).toBe(true);
  });
});
