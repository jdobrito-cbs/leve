import { describe, expect, test } from 'vitest';
import { buildServer } from './server.js';
import { MemoryStore } from './store.js';

const hub = async () => '{"foods":[]}';

describe('endurecimento de segurança', () => {
  test('cabeçalhos de segurança (helmet) presentes na resposta', async () => {
    const app = await buildServer({ callHub: hub });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  test('corpo acima do limite global é recusado (413) fora do scan', async () => {
    const app = await buildServer({
      callHub: hub,
      store: new MemoryStore(),
      jwtSecret: 'x'.repeat(40),
    });
    const big = 'a'.repeat(200 * 1024); // 200 KB > limite global de 64 KB
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@b.com', password: big },
    });
    expect(res.statusCode).toBe(413);
  });

  test('força-bruta de login é barrada por rate limit (429)', async () => {
    const app = await buildServer({
      callHub: hub,
      store: new MemoryStore(),
      jwtSecret: 'x'.repeat(40),
    });
    let sawTooMany = false;
    for (let i = 0; i < 14; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'ninguem@b.com', password: 'senhaerrada' },
      });
      if (res.statusCode === 429) {
        sawTooMany = true;
        break;
      }
    }
    expect(sawTooMany).toBe(true);
  });

  test('token de admin errado é recusado; certo é aceito (comparação constante)', async () => {
    const app = await buildServer({
      callHub: hub,
      partnerStore: new MemoryStore(),
      adminToken: 'token-de-admin-bem-longo-1234',
    });
    const bad = await app.inject({
      method: 'GET',
      url: '/partner-keys',
      headers: { authorization: 'Bearer errado' },
    });
    expect(bad.statusCode).toBe(401);
    const good = await app.inject({
      method: 'GET',
      url: '/partner-keys',
      headers: { authorization: 'Bearer token-de-admin-bem-longo-1234' },
    });
    expect(good.statusCode).toBe(200);
  });
});
