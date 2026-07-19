import { FileAdminStore } from './fileAdminStore.js';
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

// Recusa segredos fracos: um JWT_SECRET/ADMIN_TOKEN curto é adivinhável e
// comprometeria sessões e o painel. Melhor não subir do que subir inseguro.
if (JWT_SECRET && JWT_SECRET.length < 32) {
  console.error('JWT_SECRET muito curto: use pelo menos 32 caracteres aleatórios.');
  process.exit(1);
}
if (ADMIN_TOKEN && ADMIN_TOKEN.length < 16) {
  console.error('ADMIN_TOKEN muito curto: use pelo menos 16 caracteres aleatórios.');
  process.exit(1);
}

async function main() {
  let store;
  let partnerStore;
  let adminStore;
  if (DATABASE_URL && JWT_SECRET) {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaStore } = await import('./prismaStore.js');
    const prismaStore = new PrismaStore(new PrismaClient());
    store = prismaStore;
    partnerStore = prismaStore;
    adminStore = prismaStore;
    console.log('contas/backup: ATIVOS (PostgreSQL)');
  } else {
    // Sem banco: chaves de parceiro e administradores em arquivo local.
    const dir = DATA_DIR ?? './data';
    partnerStore = new FilePartnerKeyStore(`${dir}/partner-keys.json`);
    adminStore = new FileAdminStore(`${dir}/admins.json`);
    console.warn('contas/backup: desativados (defina DATABASE_URL e JWT_SECRET para ativar)');
  }

  if (ADMIN_TOKEN) console.log('painel do dono: ATIVO em /painel (login + 2FA)');
  else console.warn('painel do dono: desativado (defina ADMIN_TOKEN para ativar)');

  const hub = { baseUrl: HUB_BASE_URL!, apiKey: HUB_API_KEY!, model: HUB_MODEL! };
  const app = await buildServer({
    callHub: makeHubCaller(hub),
    callFoodHub: makeFoodHubCaller(hub),
    appToken: APP_TOKEN || undefined,
    store,
    jwtSecret: JWT_SECRET || undefined,
    partnerStore,
    adminStore,
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
