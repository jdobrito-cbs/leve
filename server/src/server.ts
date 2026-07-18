import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
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
import { ADMIN_PAGE_HTML } from './adminPage.js';
import { buildHubBody, parseHubContent, type ScanResult } from './hub.js';
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

export function makeHubCaller(config: HubConfig): CallHub {
  return async (imageBase64, mimeType) => {
    const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(buildHubBody(imageBase64, mimeType, config.model)),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('upstream sem conteúdo');
    return content;
  };
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
  appToken?: string;
  store?: Store;
  jwtSecret?: string;
  /** Chaves de parceiro geridas pelo dono (painel /admin). */
  partnerStore?: PartnerKeyStore;
  adminToken?: string;
}

const partnerCreateSchema = z.object({ label: z.string().trim().min(1).max(120) });
const partnerValidateSchema = z.object({ key: z.string().min(4).max(40) });

export function buildServer(options: ServerOptions) {
  // Stateless no scan por privacidade: a imagem não é armazenada nem registrada em log.
  const app = Fastify({ bodyLimit: 25 * 1024 * 1024, logger: false });
  const { store, jwtSecret } = options;

  app.get('/health', async () => ({ ok: true, accounts: Boolean(store) }));

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

    app.post('/auth/register', async (req, reply) => {
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
    });

    app.post('/auth/login', async (req, reply) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      const user = await store.findUserByEmail(parsed.data.email);
      if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
        return reply.code(401).send({ error: 'e-mail ou senha incorretos' });
      }
      return issueTokens(user.id);
    });

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

    app.put('/backup', async (req, reply) => {
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
    app.post('/partner-keys/validate', async (req, reply) => {
      const parsed = partnerValidateSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'corpo inválido' });
      if (!isPartnerKeyFormat(parsed.data.key)) return { valid: false };
      const record = await partnerStore.findPartnerKeyByHash(hashPartnerKey(parsed.data.key));
      if (!record || record.revokedAt) return { valid: false };
      return { valid: true, label: record.label };
    });

    if (adminToken) {
      const requireAdmin = (req: FastifyRequest, reply: FastifyReply): boolean => {
        const header = req.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        if (token !== adminToken) {
          reply.code(401).send({ error: 'não autorizado' });
          return false;
        }
        return true;
      };

      app.get('/admin', async (_req, reply) => {
        return reply.type('text/html; charset=utf-8').send(ADMIN_PAGE_HTML);
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

  app.post('/scan-food', async (req, reply) => {
    if (options.appToken && req.headers['x-leve-app'] !== options.appToken) {
      return reply.code(401).send({ error: 'não autorizado' });
    }
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'corpo inválido' });
    try {
      const content = await options.callHub(parsed.data.imageBase64, parsed.data.mimeType);
      const result: ScanResult = parseHubContent(content);
      return result;
    } catch {
      return reply.code(502).send({ error: 'não foi possível analisar a imagem agora' });
    }
  });

  return app;
}
