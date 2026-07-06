import { buildServer, makeHubCaller } from './server.js';

const { HUB_BASE_URL, HUB_API_KEY, HUB_MODEL, APP_TOKEN, PORT } = process.env;

if (!HUB_BASE_URL || !HUB_API_KEY || !HUB_MODEL) {
  console.error('Defina HUB_BASE_URL, HUB_API_KEY e HUB_MODEL (ver .env.example).');
  process.exit(1);
}

const app = buildServer({
  callHub: makeHubCaller({ baseUrl: HUB_BASE_URL, apiKey: HUB_API_KEY, model: HUB_MODEL }),
  appToken: APP_TOKEN || undefined,
});

const port = Number(PORT ?? 3333);
app
  .listen({ host: '0.0.0.0', port })
  .then(() => console.log(`leve-server ouvindo em :${port}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
