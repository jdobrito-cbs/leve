import { z } from 'zod';

export const foodsSchema = z.object({
  foods: z
    .array(
      z.object({
        name: z.string().min(1),
        portionGrams: z.number().positive().nullable().catch(null),
        confidence: z.number().min(0).max(1).catch(0.5),
        unit: z.enum(['g', 'ml']).catch('g'),
        kcalPer100: z.number().min(0).max(900).nullable().catch(null),
        proteinG: z.number().min(0).max(100).nullable().catch(null),
        carbsG: z.number().min(0).max(100).nullable().catch(null),
        fatG: z.number().min(0).max(100).nullable().catch(null),
        fiberG: z.number().min(0).max(60).nullable().catch(null),
      }),
    )
    .max(10),
});

export type ScanResult = z.infer<typeof foodsSchema>;

const SYSTEM_PROMPT = `Você identifica alimentos em fotos de refeições para um diário alimentar brasileiro e estima a nutrição de cada um.
Responda SOMENTE com JSON válido no formato:
{"foods":[{"name":"arroz branco cozido","portionGrams":150,"confidence":0.9,"unit":"g","kcalPer100":128,"proteinG":2.5,"carbsG":28,"fatG":0.2,"fiberG":1.6}]}
- Até 5 alimentos, o mais provável primeiro; nomes simples (ex.: "arroz branco cozido").
- portionGrams: estimativa da porção visível em gramas (número) ou null.
- confidence: número de 0 a 1.
- unit: "g" para sólidos, "ml" para líquidos.
- kcalPer100, proteinG, carbsG, fatG, fiberG: valores POR 100 g/ml de tabelas brasileiras (TACO/TBCA) ou rótulos; NÃO invente, campo desconhecido = null.
- Se não houver comida na foto, responda {"foods":[]}.`;

export function buildHubBody(imageBase64: string, mimeType: string, model: string) {
  return {
    model,
    response_format: { type: 'json_object' },
    max_tokens: 800,
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

export function parseHubContent(content: string): ScanResult {
  return foodsSchema.parse(JSON.parse(extractJson(content)));
}

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

const DESCRIBE_PROMPT = `Você interpreta o que uma pessoa escreveu que comeu, para um diário alimentar brasileiro, e estima a nutrição de cada item.
Responda SOMENTE com JSON válido no formato:
{"foods":[{"name":"ovo frito","portionGrams":100,"confidence":0.9,"unit":"g","kcalPer100":196,"proteinG":13.6,"carbsG":1.2,"fatG":15,"fiberG":0}]}
- Um item por alimento citado; nomes simples (ex.: "arroz branco cozido").
- portionGrams: converta as quantidades citadas ("2 ovos", "um copo") em gramas/ml; sem quantidade, use a porção típica.
- unit: "g" para sólidos, "ml" para líquidos.
- kcalPer100, proteinG, carbsG, fatG, fiberG: valores POR 100 g/ml de tabelas brasileiras (TACO/TBCA) ou rótulos; NÃO invente, campo desconhecido = null.
- confidence: número de 0 a 1. Se não houver comida no texto, responda {"foods":[]}.`;

export function buildDescribeBody(text: string, model: string) {
  return {
    model,
    response_format: { type: 'json_object' },
    max_tokens: 800,
    messages: [
      { role: 'system', content: DESCRIBE_PROMPT },
      { role: 'user', content: `Comi: ${text}` },
    ],
  };
}
