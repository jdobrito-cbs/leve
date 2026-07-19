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

/** Isola o objeto JSON da resposta (tolerante a cercas de markdown e texto ao redor). */
function extractJson(content: string): string {
  const stripped = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('resposta sem JSON');
  return stripped.slice(start, end + 1);
}

/** Extrai e valida o JSON da resposta do modelo. */
export function parseHubContent(content: string): ScanResult {
  return foodsSchema.parse(JSON.parse(extractJson(content)));
}

// ——— Consulta nutricional por nome (alimento digitado à mão no app) ———

export const foodInfoSchema = z.object({
  found: z.boolean().catch(true),
  unit: z.enum(['g', 'ml']).catch('g'),
  kcalPer100: z.number().min(0).max(900).nullable().catch(null),
  proteinG: z.number().min(0).max(100).nullable().catch(null),
  carbsG: z.number().min(0).max(100).nullable().catch(null),
  fatG: z.number().min(0).max(100).nullable().catch(null),
  fiberG: z.number().min(0).max(60).nullable().catch(null),
});

export type FoodInfoResult = z.infer<typeof foodInfoSchema>;

const FOOD_INFO_PROMPT = `Você consulta tabelas nutricionais brasileiras (TACO, TBCA e rótulos oficiais) para um diário alimentar.
Responda SOMENTE com JSON válido no formato:
{"found":true,"unit":"g","kcalPer100":123,"proteinG":1.2,"carbsG":10.5,"fatG":0.4,"fiberG":0.8}
- Valores POR 100 g (sólidos, unit "g") ou POR 100 ml (líquidos, unit "ml").
- Use o valor típico de tabela oficial ou rótulo; NÃO invente: campo desconhecido = null.
- Alimento irreconhecível ou ambíguo demais: {"found":false} com os demais campos null.`;

/** Corpo OpenAI-compatível da consulta nutricional por texto. */
export function buildFoodInfoBody(name: string, model: string) {
  return {
    model,
    response_format: { type: 'json_object' },
    max_tokens: 200,
    messages: [
      { role: 'system', content: FOOD_INFO_PROMPT },
      { role: 'user', content: `Alimento: ${name}` },
    ],
  };
}

export function parseFoodInfoContent(content: string): FoodInfoResult {
  return foodInfoSchema.parse(JSON.parse(extractJson(content)));
}
