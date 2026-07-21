import type { FoodCandidate } from '@/services/vision/VisionProvider';

interface DescribeFood {
  name: string;
  portionGrams: number | null;
  confidence: number;
  unit?: 'g' | 'ml';
  kcalPer100?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
}

function describeUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_LEVE_SERVER_URL;
  return base ? `${base.replace(/\/$/, '')}/describe-food` : null;
}

export function isDescribeConfigured(): boolean {
  return Boolean(describeUrl());
}

export async function describeMeal(text: string): Promise<FoodCandidate[]> {
  const url = describeUrl();
  if (!url || text.trim().length < 3) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);
  try {
    const token = process.env.EXPO_PUBLIC_SCAN_TOKEN;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-leve-app': token } : {}),
      },
      body: JSON.stringify({ text: text.trim() }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { foods?: DescribeFood[] };
    return (json.foods ?? []).map((f) => ({
      label: f.name,
      confidence: f.confidence,
      portionGrams: f.portionGrams,
      unit: f.unit,
      kcalPer100: f.kcalPer100,
      proteinG: f.proteinG,
      carbsG: f.carbsG,
      fatG: f.fatG,
      fiberG: f.fiberG,
    }));
  } finally {
    clearTimeout(timer);
  }
}
