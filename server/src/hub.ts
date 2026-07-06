import { z } from 'zod';

export const foodsSchema = z.object({
  foods: z
    .array(
      z.object({
        name: z.string().min(1),
        portionGrams: z.number().positive().nullable().catch(null),
        confidence: z.number().min(0).max(1).catch(0.5),
      }),
    )
    .max(10),
});

export type ScanResult = z.infer<typeof foodsSchema>;

const SYSTEM_PROMPT = `Você identifica alimentos em fotos de refeições para um diário alimentar brasileiro.
Responda SOMENTE com JSON válido no formato:
{"foods":[{"name":"nome do alimento em português","portionGrams":123,"confidence":0.9}]}
- Até 5 alimentos, o mais provável primeiro; nomes simples (ex.: "arroz branco cozido").
- portionGrams: estimativa da porção visível em gramas (número) ou null.
- confidence: número de 0 a 1.
- Se não houver comida na foto, responda {"foods":[]}.`;

/** Corpo de requisição no formato OpenAI-compatível (chat/completions com imagem). */
export function buildHubBody(imageBase64: string, mimeType: string, model: string) {
  return {
    model,
    response_format: { type: 'json_object' },
    max_tokens: 500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          { type: 'text', text: 'Identifique os alimentos desta foto.' },
        ],
      },
    ],
  };
}

/** Extrai e valida o JSON da resposta do modelo (tolerante a cercas de markdown e texto ao redor). */
export function parseHubContent(content: string): ScanResult {
  const stripped = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('resposta sem JSON');
  return foodsSchema.parse(JSON.parse(stripped.slice(start, end + 1)));
}
