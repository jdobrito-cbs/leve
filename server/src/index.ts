import { buildServer, makeHubCaller } from './server.js';

const { HUB_BASE_URL, HUB_API_KEY, HUB_MODEL, APP_TOKEN, PORT, DATABASE_URL, JWT_SECRET } =
  process.env;

if (!HUB_BASE_URL || !HUB_API_KEY || !HUB_MODEL) {
  console.error('Defina HUB_BASE_URL, HUB_API_KEY e HUB_MODEL (ver .env.example).');
  process.exit(1);
}

async function main() {
  let store;
  if (DATABASE_URL && JWT_SECRET) {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaStore } = await import('./prismaStore.js');
    store = new PrismaStore(new PrismaClient());
    console.log('contas/backup: ATIVOS (PostgreSQL)');
  } else {
    console.warn('contas/backup: desativados (defina DATABASE_URL e JWT_SECRET para ativar)');
  }

  const app = buildServer({
    callHub: makeHubCaller({ baseUrl: HUB_BASE_URL!, apiKey: HUB_API_KEY!, model: HUB_MODEL! }),
    appToken: APP_TOKEN || undefined,
    store,
    jwtSecret: JWT_SECRET || undefined,
  });

  const port = Number(PORT ?? 3333);
  await app.listen({ host: '0.0.0.0', port });
  console.log(`leve-server ouvindo em :${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
