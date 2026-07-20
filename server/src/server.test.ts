import { describe, expect, test } from 'vitest';
import { buildServer } from './server.js';

const IMG = 'a'.repeat(200);

describe('POST /scan-food', () => {
  test('sucesso devolve foods normalizados', async () => {
    const app = await buildServer({
      callHub: async () => '{"foods":[{"name":"arroz","portionGrams":150,"confidence":0.9}]}',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/scan-food',
      payload: { imageBase64: IMG },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ foods: [{ name: 'arroz', portionGrams: 150, confidence: 0.9 }] });
  });

  test('corpo inválido → 400; upstream falha → 422; token errado → 401', async () => {
    const failing = await buildServer({
      callHub: async () => {
        throw new Error('boom');
      },
    });
    expect((await failing.inject({ method: 'POST', url: '/scan-food', payload: {} })).statusCode).toBe(400);
    // 422 (não 502): o Cloudflare substitui 5xx e o motivo do erro se perde.
    expect(
      (await failing.inject({ method: 'POST', url: '/scan-food', payload: { imageBase64: IMG } }))
        .statusCode,
    ).toBe(422);

    const guarded = await buildServer({ callHub: async () => '{"foods":[]}', appToken: 'segredo' });
    expect(
      (await guarded.inject({ method: 'POST', url: '/scan-food', payload: { imageBase64: IMG } }))
        .statusCode,
    ).toBe(401);
    expect(
      (
        await guarded.inject({
          method: 'POST',
          url: '/scan-food',
          payload: { imageBase64: IMG },
          headers: { 'x-leve-app': 'segredo' },
        })
      ).statusCode,
    ).toBe(200);
  });

  test('health', async () => {
    const app = await buildServer({ callHub: async () => '{"foods":[]}' });
    expect((await app.inject({ method: 'GET', url: '/health' })).json()).toEqual({
      ok: true,
      accounts: false,
    });
  });

  test('raiz serve a landing e /admin redireciona para /painel', async () => {
    const { MemoryStore } = await import('./store.js');
    const app = await buildServer({
      callHub: async () => '{"foods":[]}',
      partnerStore: new MemoryStore(),
      adminToken: 'segredo',
    });
    const home = await app.inject({ method: 'GET', url: '/' });
    expect(home.statusCode).toBe(200);
    expect(home.body).toContain('Leve');
    expect(home.body).toContain('não substitui');
    // Documentos legais públicos (exigência das lojas).
    const priv = await app.inject({ method: 'GET', url: '/privacidade' });
    expect(priv.statusCode).toBe(200);
    expect(priv.headers['content-type']).toContain('text/html');
    expect(priv.body).toContain('privacidade');
    expect((await app.inject({ method: 'GET', url: '/termos' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/aviso-medico' })).statusCode).toBe(200);
    const painel = await app.inject({ method: 'GET', url: '/painel' });
    expect(painel.statusCode).toBe(200);
    const old = await app.inject({ method: 'GET', url: '/admin' });
    expect(old.statusCode).toBe(302);
    expect(old.headers.location).toBe('/painel');
  });
});

describe('POST /food-info', () => {
  test('sucesso devolve valores por 100 g/ml validados', async () => {
    const app = await buildServer({
      callHub: async () => '{"foods":[]}',
      callFoodHub: async () =>
        '{"found":true,"unit":"ml","kcalPer100":42,"proteinG":0,"carbsG":10.5,"fatG":0,"fiberG":null}',
    });
    const res = await app.inject({
      method: 'POST',
      url: '/food-info',
      payload: { name: 'refrigerante de cola' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      found: true,
      unit: 'ml',
      kcalPer100: 42,
      proteinG: 0,
      carbsG: 10.5,
      fatG: 0,
      fiberG: null,
    });
  });

  test('nome curto → 400; sem callFoodHub → 503; upstream falha → 422', async () => {
    const noHub = await buildServer({ callHub: async () => '{"foods":[]}' });
    expect(
      (await noHub.inject({ method: 'POST', url: '/food-info', payload: { name: 'x' } })).statusCode,
    ).toBe(400);
    expect(
      (await noHub.inject({ method: 'POST', url: '/food-info', payload: { name: 'arroz' } }))
        .statusCode,
    ).toBe(503);
    const failing = await buildServer({
      callHub: async () => '{"foods":[]}',
      callFoodHub: async () => {
        throw new Error('boom');
      },
    });
    expect(
      (await failing.inject({ method: 'POST', url: '/food-info', payload: { name: 'arroz' } }))
        .statusCode,
    ).toBe(422);
  });
});
