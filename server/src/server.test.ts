import { describe, expect, test } from 'vitest';
import { buildServer } from './server.js';

const IMG = 'a'.repeat(200);

describe('POST /scan-food', () => {
  test('sucesso devolve foods normalizados', async () => {
    const app = buildServer({
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

  test('corpo inválido → 400; upstream falha → 502; token errado → 401', async () => {
    const failing = buildServer({
      callHub: async () => {
        throw new Error('boom');
      },
    });
    expect((await failing.inject({ method: 'POST', url: '/scan-food', payload: {} })).statusCode).toBe(400);
    expect(
      (await failing.inject({ method: 'POST', url: '/scan-food', payload: { imageBase64: IMG } }))
        .statusCode,
    ).toBe(502);

    const guarded = buildServer({ callHub: async () => '{"foods":[]}', appToken: 'segredo' });
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
    const app = buildServer({ callHub: async () => '{"foods":[]}' });
    expect((await app.inject({ method: 'GET', url: '/health' })).json()).toEqual({
      ok: true,
      accounts: false,
    });
  });
});
