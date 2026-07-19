import { FilePartnerKeyStore } from './filePartnerKeyStore.js';
import { buildServer, makeFoodHubCaller, makeHubCaller } from './server.js';

const {
  HUB_BASE_URL,
  HUB_API_KEY,
  HUB_MODEL,
  APP_TOKEN,
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  ADMIN_TOKEN,
  DATA_DIR,
} = process.env;

if (!HUB_BASE_URL || !HUB_API_KEY || !HUB_MODEL) {
  console.error('Defina HUB_BASE_URL, HUB_API_KEY e HUB_MODEL (ver .env.example).');
  process.exit(1);
}

async function main() {
  let store;
  let partnerStore;
  if (DATABASE_URL && JWT_SECRET) {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaStore } = await import('./prismaStore.js');
    const prismaStore = new PrismaStore(new PrismaClient());
    store = prismaStore;
    partnerStore = prismaStore;
    console.log('contas/backup: ATIVOS (PostgreSQL)');
  } else {
    // Sem banco: chaves de parceiro em arquivo local (painel funciona igual).
    partnerStore = new FilePartnerKeyStore(`${DATA_DIR ?? './data'}/partner-keys.json`);
    console.warn('contas/backup: desativados (defina DATABASE_URL e JWT_SECRET para ativar)');
  }

  if (ADMIN_TOKEN) console.log('painel de parceiros: ATIVO em /admin');
  else console.warn('painel de parceiros: desativado (defina ADMIN_TOKEN para ativar)');

  const hub = { baseUrl: HUB_BASE_URL!, apiKey: HUB_API_KEY!, model: HUB_MODEL! };
  const app = buildServer({
    callHub: makeHubCaller(hub),
    callFoodHub: makeFoodHubCaller(hub),
    appToken: APP_TOKEN || undefined,
    store,
    jwtSecret: JWT_SECRET || undefined,
    partnerStore,
    adminToken: ADMIN_TOKEN || undefined,
  });

  const port = Number(PORT ?? 3333);
  await app.listen({ host: '0.0.0.0', port });
  console.log(`leve-server ouvindo em :${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
