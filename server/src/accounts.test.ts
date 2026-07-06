import { describe, expect, test } from 'vitest';
import { buildServer } from './server.js';
import { MemoryStore } from './store.js';

function makeApp() {
  return buildServer({
    callHub: async () => '{"foods":[]}',
    store: new MemoryStore(),
    jwtSecret: 'segredo-de-teste',
  });
}

const CREDS = { email: 'jorge@exemplo.com', password: 'senha-forte-123' };

describe('contas e backup E2E', () => {
  test('registro exige termos; login e /me funcionam', async () => {
    const app = makeApp();
    const noTerms = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { ...CREDS, consents: { terms: false, backup: true } },
    });
    expect(noTerms.statusCode).toBe(400);

    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { ...CREDS, consents: { terms: true, backup: true } },
    });
    expect(reg.statusCode).toBe(200);
    const { accessToken } = reg.json();

    const dup = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { ...CREDS, consents: { terms: true, backup: false } },
    });
    expect(dup.statusCode).toBe(409);

    const me = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(CREDS.email);
    expect(me.json().consents.map((c: { kind: string }) => c.kind).sort()).toEqual([
      'backup',
      'terms',
    ]);
  });

  test('backup roundtrip e refresh com rotação', async () => {
    const app = makeApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { ...CREDS, consents: { terms: true, backup: true } },
    });
    const { accessToken, refreshToken } = reg.json();
    const auth = { authorization: `Bearer ${accessToken}` };

    expect((await app.inject({ method: 'GET', url: '/backup', headers: auth })).statusCode).toBe(404);
    const put = await app.inject({
      method: 'PUT',
      url: '/backup',
      headers: auth,
      payload: { blob: 'blob-cifrado-base64' },
    });
    expect(put.statusCode).toBe(200);
    const got = await app.inject({ method: 'GET', url: '/backup', headers: auth });
    expect(got.json().blob).toBe('blob-cifrado-base64');

    const refreshed = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });
    expect(refreshed.statusCode).toBe(200);
    // rotação: o token antigo não vale mais
    const reused = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });
    expect(reused.statusCode).toBe(401);
  });

  test('excluir conta exige senha e apaga tudo', async () => {
    const app = makeApp();
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { ...CREDS, consents: { terms: true, backup: true } },
    });
    const auth = { authorization: `Bearer ${reg.json().accessToken}` };
    await app.inject({ method: 'PUT', url: '/backup', headers: auth, payload: { blob: 'x' } });

    const wrong = await app.inject({
      method: 'DELETE',
      url: '/account',
      headers: auth,
      payload: { password: 'errada' },
    });
    expect(wrong.statusCode).toBe(401);

    const del = await app.inject({
      method: 'DELETE',
      url: '/account',
      headers: auth,
      payload: { password: CREDS.password },
    });
    expect(del.statusCode).toBe(204);

    const login = await app.inject({ method: 'POST', url: '/auth/login', payload: CREDS });
    expect(login.statusCode).toBe(401);
  });

  test('sem store, rotas de conta não existem e health indica', async () => {
    const app = buildServer({ callHub: async () => '{"foods":[]}' });
    expect((await app.inject({ method: 'GET', url: '/health' })).json()).toEqual({
      ok: true,
      accounts: false,
    });
    expect(
      (await app.inject({ method: 'POST', url: '/auth/login', payload: CREDS })).statusCode,
    ).toBe(404);
  });
});
