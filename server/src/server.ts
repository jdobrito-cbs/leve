import { timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { z } from 'zod';
import {
  REFRESH_TTL_MS,
  hashPassword,
  hashRefreshToken,
  newRefreshToken,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
} from './auth.js';

/** Comparação de segredos em tempo constante (evita timing attack). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Hash-alvo fixo para gastar o mesmo tempo de verificação quando o e-mail não
 *  existe — sem isto, o tempo de resposta revela quais e-mails têm conta. */
const DUMMY_PASSWORD_HASH = hashPassword('leve-dummy-password-for-timing');
import { ADMIN_PAGE_HTML } from './adminPage.js';
import { LANDING_PAGE_HTML } from './landingPage.js';
import {
  buildFoodInfoBody,
  buildHubBody,
  parseFoodInfoContent,
  parseHubContent,
  type FoodInfoResult,
  type ScanResult,
} from './hub.js';
import {
  generatePartnerKey,
  hashPartnerKey,
  isPartnerKeyFormat,
  partnerKeyHint,
} from './partnerKeys.js';
import type { PartnerKeyStore, Store } from './store.js';

export interface HubConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** Chama o AI Hub e devolve o texto de resposta do modelo. */
export type CallHub = (imageBase64: string, mimeType: string) => Promise<string>;

const bodySchema = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.string().regex(/^image\//).default('image/jpeg'),
});

async function chatCompletion(config: HubConfig, body: object, timeoutMs: number): Promise<string> {
  const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('upstream sem conteúdo');
  return content;
}

export function makeHubCaller(config: HubConfig): CallHub {
  return (imageBase64, mimeType) =>
    chatCompletion(config, buildHubBody(imageBase64, mimeType, config.model), 30_000);
}

/** Consulta nutricional por nome (texto puro, sem imagem). */
export type CallFoodHub = (name: string) => Promise<string>;

export function makeFoodHubCaller(config: HubConfig): CallFoodHub {
  return (name) => chatCompletion(config, buildFoodInfoBody(name, config.model), 20_000);
}

const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(200),
  consents: z.object({ terms: z.literal(true), backup: z.boolean().default(false) }),
});
const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
const refreshSchema = z.object({ refreshToken: z.string().min(32) });
const consentSchema = z.object({ kind: z.enum(['backup']), granted: z.boolean() });
const backupSchema = z.object({ blob: z.string().min(1).max(24 * 1024 * 1024) });
const deleteSchema = z.object({ password: z.string().min(1) });

export interface ServerOptions {
  callHub: CallHub;
  /** Consulta nutricional por nome; ausente = rota /food-info responde 503. */
  callFoodHub?: CallFoodHub;
  appToken?: string;
  store?: Store;
  jwtSecret?: string;
  /** Chaves de parceiro geridas pelo dono (painel /painel). */
  partnerStore?: PartnerKeyStore;
  adminToken?: string;
}

const partnerCreateSchema = z.object({ label: z.string().trim().min(1).max(120) });
const partnerValidateSchema = z.object({ key: z.string().min(4).max(40) });

export async function buildServer(options: ServerOptions) {
  // Corpo pequeno por padrão (barra DoS de memória); só /scan-food e /backup
  // sobem o limite por rota. Sem log de corpo por privacidade.
  const app = Fastify({ bodyLimit: 64 * 1024, logger: false });
  const { store, jwtSecret } = options;

  // Plugins registrados com await ANTES das rotas: o rate limit por rota depende
  // do hook onRoute já estar instalado quando cada rota é adicionada.
  // Cabeçalhos de segurança (noSniff, frameguard, HSTS, Referrer-Policy) + CSP.
  // As páginas do painel e da landing são inline por design → 'unsafe-inline'.
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  });
  // Sem CORS de navegador: a API é consumida pelos apps nativos (sem Origin) e
  // pela landing/painel na mesma origem. Requisições cross-site são recusadas.
  // Limite de taxa global (anti-abuso/força-bruta); rotas sensíveis apertam mais.
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  app.get('/health', async () => ({ ok: true, accounts: Boolean(store) }));

  // Raiz do domínio: landing do produto para quem chega pelo site.
  app.get('/', async (_req, reply) => {
    return reply.type('text/html; charset=utf-8').send(LANDING_PAGE_HTML);
  });

  if (store && jwtSecret) {
    const issueTokens = async (userId: string) => {
      const refreshToken = newRefreshToken();
      await store.saveRefreshToken(
        userId,
        hashRefreshToken(refreshToken),
        new Date(Date.now() + REFRESH_TTL_MS),
      );
      return { accessToken: signAccessToken(userId, jwtSecret), refreshToken };
    };

    const requireUser = async (req: FastifyRequest, reply: FastifyReply) => {
      const header = req.headers.authorization ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      const userId = token ? verifyAccessToken(token, jwtSecret) : null;
      if (!userId) {
        reply.code(401).send({ error: 'não autenticado' });
        return null;
      }
      return userId;
    };

    app.post(
      '/auth/register',
      { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
      async (req, reply) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
        const { email, password, consents } = parsed.data;
        if (await store.findUserByEmail(email)) {
          return reply.code(409).send({ error: 'e-mail já cadastrado' });
        }
        const user = await store.createUser(email, hashPassword(password));
        await store.setConsent(user.id, 'terms', true);
        await store.setConsent(user.id, 'backup', consents.backup);
        return issueTokens(user.id);
      },
    );

    app.post(
      '/auth/login',
      { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
      async (req, reply) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
        const user = await store.findUserByEmail(parsed.data.email);
        // Verifica sempre (contra hash real ou dummy) — mesmo custo de tempo com
        // e sem conta, para não vazar quais e-mails existem por timing.
        const ok = verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!user || !ok) {
          return reply.code(401).send({ error: 'e-mail ou senha incorretos' });
        }
        return issueTokens(user.id);
      },
    );

    app.post('/auth/refresh', async (req, reply) => {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      const tokenHash = hashRefreshToken(parsed.data.refreshToken);
      const record = await store.findRefreshToken(tokenHash);
      if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) {
        return reply.code(401).send({ error: 'sessão expirada' });
      }
      await store.revokeRefreshToken(tokenHash); // rotação
      return issueTokens(record.userId);
    });

    app.post('/auth/logout', async (req, reply) => {
      const parsed = refreshSchema.safeParse(req.body);
      if (parsed.success) await store.revokeRefreshToken(hashRefreshToken(parsed.data.refreshToken));
      return reply.code(204).send();
    });

    app.get('/me', async (req, reply) => {
      const userId = await requireUser(req, reply);
      if (!userId) return;
      const user = await store.findUserById(userId);
      if (!user) return reply.code(401).send({ error: 'não autenticado' });
      const backup = await store.getBackup(userId);
      return {
        email: user.email,
        consents: await store.listConsents(userId),
        backup: backup ? { size: backup.size, updatedAt: backup.updatedAt } : null,
      };
    });

    app.post('/consents', async (req, reply) => {
      const userId = await requireUser(req, reply);
      if (!userId) return;
      const parsed = consentSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      await store.setConsent(userId, parsed.data.kind, parsed.data.granted);
      return { ok: true };
    });

    app.put('/backup', { bodyLimit: 25 * 1024 * 1024 }, async (req, reply) => {
      const userId = await requireUser(req, reply);
      if (!userId) return;
      const parsed = backupSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      // O blob chega cifrado no aparelho (E2E) — o servidor não tem a chave.
      await store.putBackup(userId, parsed.data.blob);
      return { ok: true };
    });

    app.get('/backup', async (req, reply) => {
      const userId = await requireUser(req, reply);
      if (!userId) return;
      const backup = await store.getBackup(userId);
      if (!backup) return reply.code(404).send({ error: 'sem backup' });
      return backup;
    });

    app.delete('/account', async (req, reply) => {
      const userId = await requireUser(req, reply);
      if (!userId) return;
      const parsed = deleteSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      const user = await store.findUserById(userId);
      if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
        return reply.code(401).send({ error: 'senha incorreta' });
      }
      await store.deleteUser(userId);
      return reply.code(204).send();
    });
  }

  const { partnerStore, adminToken } = options;
  if (partnerStore) {
    // Validação pública: o app confere a chave no resgate e periodicamente
    // (revogação passa a valer na próxima verificação do aparelho).
    app.post(
      '/partner-keys/validate',
      { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
      async (req, reply) => {
        const parsed = partnerValidateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'corpo inválido' });
        if (!isPartnerKeyFormat(parsed.data.key)) return { valid: false };
        const record = await partnerStore.findPartnerKeyByHash(hashPartnerKey(parsed.data.key));
        if (!record || record.revokedAt) return { valid: false };
        return { valid: true, label: record.label };
      },
    );

    if (adminToken) {
      const requireAdmin = (req: FastifyRequest, reply: FastifyReply): boolean => {
        const header = req.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        // Comparação em tempo constante — o `!==` vazava o token por timing.
        if (!token || !safeEqual(token, adminToken)) {
          reply.code(401).send({ error: 'não autorizado' });
          return false;
        }
        return true;
      };

      // Painel do dono em /painel (a raiz do domínio é a landing do produto).
      app.get('/painel', async (_req, reply) => {
        return reply.type('text/html; charset=utf-8').send(ADMIN_PAGE_HTML);
      });
      // Endereço antigo continua funcionando para quem tem o link salvo.
      app.get('/admin', async (_req, reply) => {
        return reply.redirect('/painel');
      });

      app.get('/partner-keys', async (req, reply) => {
        if (!requireAdmin(req, reply)) return;
        const keys = await partnerStore.listPartnerKeys();
        // Nunca devolve o hash — só metadados de exibição.
        return keys.map(({ id, label, hint, createdAt, revokedAt }) => ({
          id,
          label,
          hint,
          createdAt,
          revokedAt,
        }));
      });

      app.post('/partner-keys', async (req, reply) => {
        if (!requireAdmin(req, reply)) return;
        const parsed = partnerCreateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'informe o nome do parceiro' });
        const key = generatePartnerKey();
        const record = await partnerStore.createPartnerKey(
          parsed.data.label,
          hashPartnerKey(key),
          partnerKeyHint(key),
        );
        // Única resposta que contém o código completo.
        return { id: record.id, label: record.label, key, createdAt: record.createdAt };
      });

      app.post('/partner-keys/:id/revoke', async (req, reply) => {
        if (!requireAdmin(req, reply)) return;
        const { id } = req.params as { id: string };
        const done = await partnerStore.revokePartnerKey(id);
        if (!done) return reply.code(404).send({ error: 'chave não encontrada ou já revogada' });
        return { ok: true };
      });
    }
  }

  // Header do app é embutido no bundle público (EXPO_PUBLIC) → não é segredo
  // real; serve só para barrar tráfego casual. A proteção efetiva de custo/DoS
  // nas rotas de IA é o rate limit por rota abaixo. Comparação em tempo constante.
  const appTokenOk = (req: FastifyRequest): boolean => {
    if (!options.appToken) return true;
    const sent = req.headers['x-leve-app'];
    return typeof sent === 'string' && safeEqual(sent, options.appToken);
  };

  app.post(
    '/scan-food',
    { bodyLimit: 25 * 1024 * 1024, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      if (!appTokenOk(req)) return reply.code(401).send({ error: 'não autorizado' });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'corpo inválido' });
      try {
        const content = await options.callHub(parsed.data.imageBase64, parsed.data.mimeType);
        const result: ScanResult = parseHubContent(content);
        return result;
      } catch {
        return reply.code(502).send({ error: 'não foi possível analisar a imagem agora' });
      }
    },
  );

  const foodInfoBodySchema = z.object({ name: z.string().trim().min(2).max(120) });

  app.post(
    '/food-info',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (req, reply) => {
      if (!appTokenOk(req)) return reply.code(401).send({ error: 'não autorizado' });
      const parsed = foodInfoBodySchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'corpo inválido' });
      if (!options.callFoodHub) return reply.code(503).send({ error: 'consulta indisponível' });
      try {
        const content = await options.callFoodHub(parsed.data.name);
        const result: FoodInfoResult = parseFoodInfoContent(content);
        return result;
      } catch {
        return reply.code(502).send({ error: 'não foi possível consultar agora' });
      }
    },
  );

  return app;
}
