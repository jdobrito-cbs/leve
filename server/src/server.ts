import Fastify from 'fastify';
import { z } from 'zod';
import { buildHubBody, parseHubContent, type ScanResult } from './hub.js';

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

export function buildServer(options: { callHub: CallHub; appToken?: string }) {
  // Stateless por privacidade: a imagem não é armazenada nem registrada em log.
  const app = Fastify({ bodyLimit: 8 * 1024 * 1024, logger: false });

  app.get('/health', async () => ({ ok: true }));

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
