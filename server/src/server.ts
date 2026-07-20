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
import { APPLE_ICON_PNG, FAVICON_PNG } from './siteAssets.js';
import { MEDICAL_PAGE_HTML, PRIVACY_PAGE_HTML, TERMS_PAGE_HTML } from './legalPages.js';
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
import {
  adminEncKey,
  adminSessionSecret,
  canChangePassword,
  canCreateAdmin,
  canDeleteAdmin,
  canResetTotp,
  clearSessionCookie,
  decryptSecret,
  encryptSecret,
  ENROLL_TTL_SEC,
  FULL_TTL_SEC,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  LOCK_MS,
  MAX_FAILED,
  otpauthUrl,
  qrDataUrl,
  readSessionCookie,
  serializeSessionCookie,
  signAdminSession,
  verifyAdminSession,
  verifyTotp,
  type AdminScope,
} from './adminAuth.js';
import type { AdminRecord, AdminStore, PartnerKeyStore, Store } from './store.js';

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
  /** Administradores do painel (login + 2FA); ausente = só o ADMIN_TOKEN. */
  adminStore?: AdminStore;
  adminToken?: string;
  /** Ligue quando o servidor roda atrás de um proxy HTTPS (Caddy/Nginx):
   *  o rate limit passa a ver o IP real do visitante (X-Forwarded-For) em vez
   *  do IP do proxy — sem isto, todos dividiriam o mesmo limite. */
  trustProxy?: boolean;
}

const partnerCreateSchema = z.object({ label: z.string().trim().min(1).max(120) });
const partnerValidateSchema = z.object({
  key: z.string().min(4).max(40),
  // Id do aparelho (gerado no app) para a trava de 1 dispositivo; opcional para
  // compatibilidade com versões antigas do app, que validam só pela chave.
  deviceId: z.string().trim().min(8).max(200).optional(),
});

// Painel: o acesso é por e-mail (normalizado p/ minúsculas) + senha forte.
// Internamente o campo continua se chamando `username` (guarda o e-mail).
const adminEmailSchema = z.string().trim().toLowerCase().email().max(80);
const adminPasswordSchema = z.string().min(8).max(200);
const adminSetupSchema = z.object({
  adminToken: z.string().min(1),
  email: adminEmailSchema,
  password: adminPasswordSchema,
});
const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(80),
  password: z.string().min(1).max(200),
  code: z.string().trim().max(9).optional(),
  backupCode: z.string().trim().max(20).optional(),
});
const adminConfirm2faSchema = z.object({ code: z.string().trim().min(6).max(7) });
const adminCreateSchema = z.object({ email: adminEmailSchema, password: adminPasswordSchema });
const adminOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: adminPasswordSchema,
});
const adminSetPasswordSchema = z.object({ newPassword: adminPasswordSchema });
const adminRecoverSchema = z.object({
  adminToken: z.string().min(1),
  newPassword: adminPasswordSchema,
});

export async function buildServer(options: ServerOptions) {
  // Corpo pequeno por padrão (barra DoS de memória); só /scan-food e /backup
  // sobem o limite por rota. Sem log de corpo por privacidade.
  const app = Fastify({
    bodyLimit: 64 * 1024,
    logger: false,
    trustProxy: options.trustProxy ?? false,
  });
  const { store, jwtSecret } = options;

  // POST sem corpo com content-type application/json não pode virar 400:
  // navegadores enviam o cabeçalho por padrão e várias rotas do painel
  // (2FA, revogar, sair) não têm corpo. Vazio → undefined; inválido → 400.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (body === '' || body == null) return done(null, undefined);
    try {
      done(null, JSON.parse(body as string));
    } catch {
      const err = new Error('JSON inválido') as Error & { statusCode: number };
      err.statusCode = 400;
      done(err, undefined);
    }
  });

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

  // Ícones do site (logotipo do app na aba do navegador e em favoritos).
  const pngRoute = (bytes: Buffer) => async (_req: FastifyRequest, reply: FastifyReply) =>
    reply.type('image/png').header('cache-control', 'public, max-age=86400').send(bytes);
  app.get('/favicon.png', pngRoute(FAVICON_PNG));
  app.get('/favicon.ico', pngRoute(FAVICON_PNG)); // navegadores pedem por padrão
  app.get('/apple-touch-icon.png', pngRoute(APPLE_ICON_PNG));

  // Raiz do domínio: landing do produto para quem chega pelo site.
  app.get('/', async (_req, reply) => {
    return reply.type('text/html; charset=utf-8').send(LANDING_PAGE_HTML);
  });

  // Documentos legais públicos (exigidos pelas lojas em URL pública).
  const htmlPage = (html: string) => async (_req: FastifyRequest, reply: FastifyReply) =>
    reply.type('text/html; charset=utf-8').send(html);
  app.get('/privacidade', htmlPage(PRIVACY_PAGE_HTML));
  app.get('/termos', htmlPage(TERMS_PAGE_HTML));
  app.get('/aviso-medico', htmlPage(MEDICAL_PAGE_HTML));

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

  const { partnerStore, adminStore, adminToken } = options;

  // Segredos derivados do ADMIN_TOKEN: assinam a sessão e cifram o segredo TOTP.
  const adminSecret = adminToken ? adminSessionSecret(adminToken) : '';
  const encKey = adminToken ? adminEncKey(adminToken) : Buffer.alloc(0);

  /** Carrega o admin logado a partir do cookie de sessão (null se inválido). */
  const loadSession = async (
    req: FastifyRequest,
    scope: 'full' | 'any',
  ): Promise<{ admin: AdminRecord; scope: AdminScope } | null> => {
    if (!adminStore || !adminToken) return null;
    const raw = readSessionCookie(req.headers.cookie);
    if (!raw) return null;
    const session = verifyAdminSession(raw, adminSecret);
    if (!session) return null;
    if (scope === 'full' && session.scope !== 'full') return null;
    const admin = await adminStore.findAdminById(session.sub);
    if (!admin) return null;
    if (admin.tokenVersion !== session.ver) return null; // sessão invalidada (troca de senha/reset)
    return { admin, scope: session.scope };
  };

  /** Conta uma tentativa falha e bloqueia por um tempo ao passar do limite. */
  const registerFailure = async (admin: AdminRecord): Promise<void> => {
    if (!adminStore) return;
    const failed = admin.failedAttempts + 1;
    if (failed >= MAX_FAILED) {
      await adminStore.updateAdmin(admin.id, {
        failedAttempts: 0,
        lockedUntil: new Date(Date.now() + LOCK_MS).toISOString(),
      });
    } else {
      await adminStore.updateAdmin(admin.id, { failedAttempts: failed });
    }
  };

  const setSession = (
    req: FastifyRequest,
    reply: FastifyReply,
    admin: AdminRecord,
    scope: AdminScope,
  ): void => {
    const ttl = scope === 'full' ? FULL_TTL_SEC : ENROLL_TTL_SEC;
    // Secure só quando o acesso veio por HTTPS (com TRUST_PROXY, o protocolo é
    // o do visitante). Em http simples (teste por IP), o navegador descartaria
    // um cookie Secure e o login não se sustentaria.
    const secure = req.protocol === 'https';
    reply.header(
      'set-cookie',
      serializeSessionCookie(signAdminSession(admin, scope, adminSecret, ttl), ttl, secure),
    );
  };

  // Painel (HTML) servido sempre que há ADMIN_TOKEN; as ações exigem sessão.
  if (adminToken) {
    app.get('/painel', async (_req, reply) =>
      reply.type('text/html; charset=utf-8').send(ADMIN_PAGE_HTML),
    );
    app.get('/admin', async (_req, reply) => reply.redirect('/painel'));
  }

  // API de administradores (login + 2FA + CRUD). Precisa de store + ADMIN_TOKEN.
  if (adminStore && adminToken) {
    app.get(
      '/admin/setup-state',
      { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
      async () => ({ needsSetup: (await adminStore.countAdmins()) === 0 }),
    );

    // Cadastro do master — só na primeira vez e exige o ADMIN_TOKEN do servidor.
    app.post(
      '/admin/setup',
      { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
      async (req, reply) => {
        const parsed = adminSetupSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
        if ((await adminStore.countAdmins()) > 0) {
          return reply.code(409).send({ error: 'painel já configurado' });
        }
        if (!safeEqual(parsed.data.adminToken, adminToken)) {
          return reply.code(401).send({ error: 'código do servidor incorreto' });
        }
        const master = await adminStore.createAdmin({
          username: parsed.data.email,
          role: 'master',
          passwordHash: hashPassword(parsed.data.password),
          totpSecretEnc: null,
          totpEnabled: false,
          backupCodeHashes: [],
          tokenVersion: 0,
          failedAttempts: 0,
          lockedUntil: null,
        });
        setSession(req, reply, master, 'enroll'); // segue direto para configurar o 2FA
        return { ok: true, needEnroll: true };
      },
    );

    app.post(
      '/admin/login',
      { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
      async (req, reply) => {
        const parsed = adminLoginSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
        const admin = await adminStore.findAdminByUsername(parsed.data.email);
        if (admin?.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now()) {
          return reply.code(429).send({ error: 'muitas tentativas; tente mais tarde' });
        }
        // Verifica sempre (hash real ou dummy) para não vazar e-mails por timing.
        const pwOk = verifyPassword(parsed.data.password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!admin || !pwOk) {
          if (admin) await registerFailure(admin);
          return reply.code(401).send({ error: 'e-mail ou senha incorretos' });
        }
        if (!admin.totpEnabled) {
          // Senha certa, mas 2FA ainda não configurado → sessão de configuração.
          await adminStore.updateAdmin(admin.id, { failedAttempts: 0, lockedUntil: null });
          setSession(req, reply, admin, 'enroll');
          return { ok: true, needEnroll: true };
        }
        // 2FA obrigatório: aceita o código do app OU um código de backup.
        let second = false;
        if (parsed.data.backupCode) {
          const hash = hashBackupCode(parsed.data.backupCode);
          if (admin.backupCodeHashes.includes(hash)) {
            await adminStore.updateAdmin(admin.id, {
              backupCodeHashes: admin.backupCodeHashes.filter((h) => h !== hash),
            });
            second = true;
          }
        } else if (parsed.data.code) {
          const secret = admin.totpSecretEnc ? decryptSecret(admin.totpSecretEnc, encKey) : null;
          second = Boolean(secret && verifyTotp(secret, parsed.data.code));
        } else {
          return reply.code(401).send({ error: 'informe o código de verificação', need2fa: true });
        }
        if (!second) {
          await registerFailure(admin);
          return reply.code(401).send({ error: 'código de verificação incorreto', need2fa: true });
        }
        await adminStore.updateAdmin(admin.id, { failedAttempts: 0, lockedUntil: null });
        setSession(req, reply, admin, 'full');
        return { ok: true };
      },
    );

    app.post('/admin/logout', async (_req, reply) => {
      reply.header('set-cookie', clearSessionCookie());
      return reply.code(204).send();
    });

    app.get('/admin/me', async (req, reply) => {
      const sess = await loadSession(req, 'any');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      return {
        id: sess.admin.id,
        email: sess.admin.username,
        role: sess.admin.role,
        totpEnabled: sess.admin.totpEnabled,
        needEnroll: sess.scope === 'enroll' || !sess.admin.totpEnabled,
      };
    });

    // Configuração do 2FA: gera o segredo e devolve a URL otpauth (para QR/manual).
    app.post('/admin/2fa/setup', async (req, reply) => {
      const sess = await loadSession(req, 'any');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      if (sess.admin.totpEnabled) return reply.code(409).send({ error: '2FA já ativo' });
      const secret = generateTotpSecret();
      await adminStore.updateAdmin(sess.admin.id, { totpSecretEnc: encryptSecret(secret, encKey) });
      const url = otpauthUrl(secret, sess.admin.username);
      // QR é conveniência: se falhar por qualquer motivo, a chave manual segue.
      let qr: string | null = null;
      try {
        qr = qrDataUrl(url);
      } catch {
        qr = null;
      }
      return { secret, otpauthUrl: url, qr };
    });

    // Confirma o 2FA com um código válido e devolve os códigos de backup (uma vez).
    app.post('/admin/2fa/confirm', async (req, reply) => {
      const sess = await loadSession(req, 'any');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      if (sess.admin.totpEnabled) return reply.code(409).send({ error: '2FA já ativo' });
      const parsed = adminConfirm2faSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      const secret = sess.admin.totpSecretEnc ? decryptSecret(sess.admin.totpSecretEnc, encKey) : null;
      if (!secret) return reply.code(400).send({ error: 'inicie a configuração do 2FA' });
      if (!verifyTotp(secret, parsed.data.code)) {
        return reply.code(400).send({ error: 'código incorreto' });
      }
      const codes = generateBackupCodes();
      const updated = await adminStore.updateAdmin(sess.admin.id, {
        totpEnabled: true,
        backupCodeHashes: codes.map(hashBackupCode),
        tokenVersion: sess.admin.tokenVersion + 1,
        failedAttempts: 0,
        lockedUntil: null,
      });
      if (updated) setSession(req, reply, updated, 'full');
      return { ok: true, backupCodes: codes };
    });

    app.get('/admin/list', async (req, reply) => {
      const sess = await loadSession(req, 'full');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      const admins = await adminStore.listAdmins();
      return admins.map((a) => ({
        id: a.id,
        email: a.username,
        role: a.role,
        totpEnabled: a.totpEnabled,
        createdAt: a.createdAt,
        isSelf: a.id === sess.admin.id,
      }));
    });

    // Cadastrar novo administrador — só o master.
    app.post('/admin', async (req, reply) => {
      const sess = await loadSession(req, 'full');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      if (!canCreateAdmin(sess.admin)) return reply.code(403).send({ error: 'só o master cadastra' });
      const parsed = adminCreateSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      if (await adminStore.findAdminByUsername(parsed.data.email)) {
        return reply.code(409).send({ error: 'e-mail já cadastrado' });
      }
      const created = await adminStore.createAdmin({
        username: parsed.data.email,
        role: 'admin',
        passwordHash: hashPassword(parsed.data.password),
        totpSecretEnc: null,
        totpEnabled: false,
        backupCodeHashes: [],
        tokenVersion: 0,
        failedAttempts: 0,
        lockedUntil: null,
      });
      return { ok: true, id: created.id };
    });

    // Trocar a PRÓPRIA senha (exige a senha atual; mantém a sessão viva).
    app.post('/admin/password', async (req, reply) => {
      const sess = await loadSession(req, 'full');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      const parsed = adminOwnPasswordSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      if (!verifyPassword(parsed.data.currentPassword, sess.admin.passwordHash)) {
        return reply.code(401).send({ error: 'senha atual incorreta' });
      }
      const updated = await adminStore.updateAdmin(sess.admin.id, {
        passwordHash: hashPassword(parsed.data.newPassword),
        tokenVersion: sess.admin.tokenVersion + 1,
      });
      if (updated) setSession(req, reply, updated, 'full'); // renova o cookie (segue logado)
      return { ok: true };
    });

    // Redefinir a senha de OUTRO admin (sem senha atual), conforme a matriz.
    app.post('/admin/:id/password', async (req, reply) => {
      const sess = await loadSession(req, 'full');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      const { id } = req.params as { id: string };
      if (id === sess.admin.id) {
        return reply.code(400).send({ error: 'use a troca da própria senha' });
      }
      const target = await adminStore.findAdminById(id);
      if (!target) return reply.code(404).send({ error: 'administrador não encontrado' });
      if (!canChangePassword(sess.admin, target)) {
        return reply.code(403).send({ error: 'sem permissão' });
      }
      const parsed = adminSetPasswordSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
      await adminStore.updateAdmin(id, {
        passwordHash: hashPassword(parsed.data.newPassword),
        tokenVersion: target.tokenVersion + 1, // derruba as sessões dele
        failedAttempts: 0,
        lockedUntil: null,
      });
      return { ok: true };
    });

    // Excluir administrador — só o master, e nunca o próprio master.
    app.delete('/admin/:id', async (req, reply) => {
      const sess = await loadSession(req, 'full');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      const { id } = req.params as { id: string };
      const target = await adminStore.findAdminById(id);
      if (!target) return reply.code(404).send({ error: 'administrador não encontrado' });
      if (!canDeleteAdmin(sess.admin, target)) {
        return reply.code(403).send({ error: 'sem permissão' });
      }
      await adminStore.deleteAdmin(id);
      return { ok: true };
    });

    // Resetar o 2FA de outro admin (recuperação) — só o master.
    app.post('/admin/:id/reset-2fa', async (req, reply) => {
      const sess = await loadSession(req, 'full');
      if (!sess) return reply.code(401).send({ error: 'não autenticado' });
      const { id } = req.params as { id: string };
      const target = await adminStore.findAdminById(id);
      if (!target) return reply.code(404).send({ error: 'administrador não encontrado' });
      if (!canResetTotp(sess.admin, target)) {
        return reply.code(403).send({ error: 'sem permissão' });
      }
      await adminStore.updateAdmin(id, {
        totpEnabled: false,
        totpSecretEnc: null,
        backupCodeHashes: [],
        tokenVersion: target.tokenVersion + 1,
      });
      return { ok: true };
    });

    // Porta dos fundos: com o ADMIN_TOKEN do servidor, redefine a senha do master
    // e zera o 2FA dele (recuperação quando tudo mais foi perdido).
    app.post(
      '/admin/recover',
      { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
      async (req, reply) => {
        const parsed = adminRecoverSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'dados inválidos' });
        if (!safeEqual(parsed.data.adminToken, adminToken)) {
          return reply.code(401).send({ error: 'código do servidor incorreto' });
        }
        const master = (await adminStore.listAdmins()).find((a) => a.role === 'master');
        if (!master) return reply.code(404).send({ error: 'sem master; use o cadastro inicial' });
        await adminStore.updateAdmin(master.id, {
          passwordHash: hashPassword(parsed.data.newPassword),
          totpEnabled: false,
          totpSecretEnc: null,
          backupCodeHashes: [],
          tokenVersion: master.tokenVersion + 1,
          failedAttempts: 0,
          lockedUntil: null,
        });
        return { ok: true };
      },
    );
  }

  if (partnerStore) {
    // Validação pública: o app confere a chave no resgate e periodicamente.
    // Com deviceId, prende a chave a 1 aparelho no primeiro resgate.
    app.post(
      '/partner-keys/validate',
      { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
      async (req, reply) => {
        const parsed = partnerValidateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'corpo inválido' });
        if (!isPartnerKeyFormat(parsed.data.key)) return { valid: false };
        const record = await partnerStore.findPartnerKeyByHash(hashPartnerKey(parsed.data.key));
        if (!record || record.revokedAt) return { valid: false };
        const deviceId = parsed.data.deviceId;
        if (deviceId) {
          if (!record.boundDeviceId) {
            await partnerStore.bindPartnerKey(record.id, deviceId); // primeiro resgate
            return { valid: true, label: record.label };
          }
          if (record.boundDeviceId !== deviceId) {
            return { valid: false, reason: 'bound_elsewhere' };
          }
        }
        return { valid: true, label: record.label };
      },
    );

    if (adminToken) {
      // Autoriza o gestor: sessão do painel OU o ADMIN_TOKEN (chave-mestra).
      const requireAdmin = async (req: FastifyRequest, reply: FastifyReply): Promise<boolean> => {
        if (await loadSession(req, 'full')) return true;
        const header = req.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        if (token && safeEqual(token, adminToken)) return true;
        reply.code(401).send({ error: 'não autorizado' });
        return false;
      };

      app.get('/partner-keys', async (req, reply) => {
        if (!(await requireAdmin(req, reply))) return;
        const keys = await partnerStore.listPartnerKeys();
        // Nunca devolve o hash, a cifra nem o id do aparelho — só exibição.
        return keys.map(({ id, label, hint, createdAt, revokedAt, boundDeviceId, boundAt, keyEnc }) => ({
          id,
          label,
          hint,
          createdAt,
          revokedAt,
          bound: Boolean(boundDeviceId),
          boundAt,
          canReveal: Boolean(keyEnc) && !revokedAt,
        }));
      });

      app.post('/partner-keys', async (req, reply) => {
        if (!(await requireAdmin(req, reply))) return;
        const parsed = partnerCreateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: 'informe o nome do parceiro' });
        const key = generatePartnerKey();
        const record = await partnerStore.createPartnerKey(
          parsed.data.label,
          hashPartnerKey(key),
          partnerKeyHint(key),
          // Cifrada em repouso: o painel pode reexibir a chave sob demanda.
          encryptSecret(key, encKey),
        );
        return { id: record.id, label: record.label, key, createdAt: record.createdAt };
      });

      // Reexibe o código completo (o hash não volta; a cifra é decifrada aqui).
      app.get('/partner-keys/:id/reveal', async (req, reply) => {
        if (!(await requireAdmin(req, reply))) return;
        const { id } = req.params as { id: string };
        const record = (await partnerStore.listPartnerKeys()).find((k) => k.id === id);
        if (!record) return reply.code(404).send({ error: 'chave não encontrada' });
        if (record.revokedAt) return reply.code(410).send({ error: 'chave revogada' });
        const key = record.keyEnc ? decryptSecret(record.keyEnc, encKey) : null;
        if (!key) {
          return reply
            .code(404)
            .send({ error: 'esta chave não pode ser reexibida (emitida antes do recurso)' });
        }
        return { id: record.id, label: record.label, key };
      });

      app.post('/partner-keys/:id/revoke', async (req, reply) => {
        if (!(await requireAdmin(req, reply))) return;
        const { id } = req.params as { id: string };
        const done = await partnerStore.revokePartnerKey(id);
        if (!done) return reply.code(404).send({ error: 'chave não encontrada ou já revogada' });
        return { ok: true };
      });

      // Desvincular: libera a chave para o parceiro usar em outro aparelho.
      app.post('/partner-keys/:id/unbind', async (req, reply) => {
        if (!(await requireAdmin(req, reply))) return;
        const { id } = req.params as { id: string };
        const done = await partnerStore.unbindPartnerKey(id);
        if (!done) return reply.code(404).send({ error: 'chave não encontrada ou já livre' });
        return { ok: true };
      });

      // Limpeza do painel: apaga da lista uma chave JÁ revogada.
      app.delete('/partner-keys/:id', async (req, reply) => {
        if (!(await requireAdmin(req, reply))) return;
        const { id } = req.params as { id: string };
        const done = await partnerStore.deletePartnerKey(id);
        if (!done) {
          return reply.code(404).send({ error: 'chave não encontrada ou ainda ativa (revogue antes)' });
        }
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
