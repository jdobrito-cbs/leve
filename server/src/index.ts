import { FileAdminStore } from './fileAdminStore.js';
import { FilePartnerKeyStore } from './filePartnerKeyStore.js';
import { buildServer, makeDescribeHubCaller, makeFoodHubCaller, makeHubCaller } from './server.js';

const {
  HUB_BASE_URL,
  HUB_API_KEY,
  HUB_MODEL,
  APP_TOKEN,
  PORT,
  DATABASE_URL,
  ADMIN_TOKEN,
  DATA_DIR,
  TRUST_PROXY,
} = process.env;

const hubConfigured = Boolean(HUB_BASE_URL && HUB_API_KEY && HUB_MODEL);
if (!hubConfigured) {
  console.warn(
    'IA de comida: DESATIVADA. Defina HUB_BASE_URL, HUB_API_KEY e HUB_MODEL no .env (ver .env.example).',
  );
}

if (ADMIN_TOKEN && ADMIN_TOKEN.length < 16) {
  console.error('ADMIN_TOKEN muito curto: use pelo menos 16 caracteres aleatórios.');
  process.exit(1);
}

async function main() {
  let partnerStore;
  let adminStore;
  if (DATABASE_URL) {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaStore } = await import('./prismaStore.js');
    const prismaStore = new PrismaStore(new PrismaClient());
    partnerStore = prismaStore;
    adminStore = prismaStore;
    console.log('armazenamento: PostgreSQL (chaves de parceiro e admin)');
  } else {
    const dir = DATA_DIR ?? './data';
    partnerStore = new FilePartnerKeyStore(`${dir}/partner-keys.json`);
    adminStore = new FileAdminStore(`${dir}/admins.json`);
    console.log('armazenamento: arquivos locais (defina DATABASE_URL para usar PostgreSQL)');
  }

  if (ADMIN_TOKEN) console.log('painel do dono: ATIVO em /painel (login + 2FA)');
  else console.warn('painel do dono: desativado (defina ADMIN_TOKEN para ativar)');

  const hub = hubConfigured
    ? { baseUrl: HUB_BASE_URL!, apiKey: HUB_API_KEY!, model: HUB_MODEL! }
    : null;
  const app = await buildServer({
    callHub: hub
      ? makeHubCaller(hub)
      : async () => {
          throw new Error('IA não configurada');
        },
    callFoodHub: hub ? makeFoodHubCaller(hub) : undefined,
    callDescribeHub: hub ? makeDescribeHubCaller(hub) : undefined,
    appToken: APP_TOKEN || undefined,
    partnerStore,
    adminStore,
    adminToken: ADMIN_TOKEN || undefined,
    trustProxy: TRUST_PROXY === '1' || TRUST_PROXY === 'true',
  });

  const port = Number(PORT ?? 3333);
  await app.listen({ host: '0.0.0.0', port });
  console.log(`leve-server ouvindo em :${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
