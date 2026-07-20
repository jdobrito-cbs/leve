import { describe, expect, it } from 'vitest';
import { buildServer } from './server.js';
import {
  generatePartnerKey,
  hashPartnerKey,
  isPartnerKeyFormat,
  partnerKeyHint,
} from './partnerKeys.js';
import { MemoryStore } from './store.js';

describe('chaves de parceiro (helpers)', () => {
  it('gera no formato LEVE-XXXX-XXXX-XXXX e valida o formato', () => {
    const key = generatePartnerKey();
    expect(key).toMatch(/^LEVE-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(isPartnerKeyFormat(key)).toBe(true);
    expect(isPartnerKeyFormat(' leve-abcd-efgh-jkmn ')).toBe(true);
    expect(isPartnerKeyFormat('LEVE-abc')).toBe(false);
  });

  it('hash é estável e ignora caixa/espaços; hint são os 4 finais', () => {
    expect(hashPartnerKey('LEVE-AAAA-BBBB-CCCC')).toBe(hashPartnerKey('  leve-aaaa-bbbb-cccc '));
    expect(partnerKeyHint('leve-aaaa-bbbb-cccc')).toBe('CCCC');
  });
});

describe('rotas de chaves de parceiro', () => {
  const adminHeaders = { authorization: 'Bearer segredo-do-painel' };
  const makeApp = () =>
    buildServer({
      callHub: async () => '{"foods":[]}',
      partnerStore: new MemoryStore(),
      adminToken: 'segredo-do-painel',
    });

  it('cria, valida, revoga e nega a chave revogada', async () => {
    const app = await makeApp();

    const created = await app.inject({
      method: 'POST',
      url: '/partner-keys',
      headers: adminHeaders,
      payload: { label: 'Parceiro Teste' },
    });
    expect(created.statusCode).toBe(200);
    const { id, key } = created.json() as { id: string; key: string };
    expect(isPartnerKeyFormat(key)).toBe(true);

    const ok = await app.inject({
      method: 'POST',
      url: '/partner-keys/validate',
      payload: { key: key.toLowerCase() },
    });
    expect(ok.json()).toEqual({ valid: true, label: 'Parceiro Teste' });

    const revoked = await app.inject({
      method: 'POST',
      url: `/partner-keys/${id}/revoke`,
      headers: adminHeaders,
    });
    expect(revoked.statusCode).toBe(200);

    const denied = await app.inject({
      method: 'POST',
      url: '/partner-keys/validate',
      payload: { key },
    });
    expect(denied.json()).toEqual({ valid: false });
  });

  it('lista sem expor o hash e exige o código do painel', async () => {
    const app = await makeApp();
    await app.inject({
      method: 'POST',
      url: '/partner-keys',
      headers: adminHeaders,
      payload: { label: 'Dra. Ana' },
    });

    const unauthorized = await app.inject({ method: 'GET', url: '/partner-keys' });
    expect(unauthorized.statusCode).toBe(401);

    const list = await app.inject({ method: 'GET', url: '/partner-keys', headers: adminHeaders });
    const rows = list.json() as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe('Dra. Ana');
    expect(rows[0].keyHash).toBeUndefined();
  });

  it('reexibe a chave criada (cifrada em repouso) e nega sem autorização', async () => {
    const app = await makeApp();
    const created = await app.inject({
      method: 'POST',
      url: '/partner-keys',
      headers: adminHeaders,
      payload: { label: 'Dra. Ana' },
    });
    const { id, key } = created.json() as { id: string; key: string };

    // A lista informa que dá para reexibir.
    const list = await app.inject({ method: 'GET', url: '/partner-keys', headers: adminHeaders });
    expect((list.json() as Array<{ canReveal: boolean }>)[0].canReveal).toBe(true);

    // Sem autorização, nada.
    const anon = await app.inject({ method: 'GET', url: `/partner-keys/${id}/reveal` });
    expect(anon.statusCode).toBe(401);

    // Autorizado, devolve exatamente o código emitido.
    const reveal = await app.inject({
      method: 'GET',
      url: `/partner-keys/${id}/reveal`,
      headers: adminHeaders,
    });
    expect(reveal.statusCode).toBe(200);
    expect(reveal.json()).toEqual({ id, label: 'Dra. Ana', key });

    // Revogada não volta mais.
    await app.inject({ method: 'POST', url: `/partner-keys/${id}/revoke`, headers: adminHeaders });
    const gone = await app.inject({
      method: 'GET',
      url: `/partner-keys/${id}/reveal`,
      headers: adminHeaders,
    });
    expect(gone.statusCode).toBe(410);
  });

  it('serve o favicon (logotipo do app) para a aba do navegador', async () => {
    const app = await makeApp();
    for (const url of ['/favicon.png', '/favicon.ico', '/apple-touch-icon.png']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
      // Assinatura PNG (\x89PNG) — garante que o binário chegou íntegro.
      expect(res.rawPayload.subarray(1, 4).toString('ascii')).toBe('PNG');
    }
  });

  it('chave desconhecida é inválida e o painel /admin responde HTML', async () => {
    const app = await makeApp();
    const unknown = await app.inject({
      method: 'POST',
      url: '/partner-keys/validate',
      payload: { key: 'LEVE-ZZZZ-ZZZZ-ZZZZ' },
    });
    expect(unknown.json()).toEqual({ valid: false });

    const page = await app.inject({ method: 'GET', url: '/painel' });
    expect(page.statusCode).toBe(200);
    expect(page.headers['content-type']).toContain('text/html');
    expect(page.body).toContain('Painel de parceiros');
  });
});
