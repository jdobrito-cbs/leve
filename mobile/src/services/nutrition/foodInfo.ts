import type { PortionUnit } from '@/core/types';

export interface FoodInfo {
  unit: PortionUnit;
  kcalPer100: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
}

function foodInfoUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_LEVE_SERVER_URL;
  return base ? `${base.replace(/\/$/, '')}/food-info` : null;
}

export async function lookupFoodInfo(name: string): Promise<FoodInfo | null> {
  const url = foodInfoUrl();
  if (!url || name.trim().length < 2) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const token = process.env.EXPO_PUBLIC_SCAN_TOKEN;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-leve-app': token } : {}),
      },
      body: JSON.stringify({ name: name.trim() }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      found?: boolean;
      unit?: string;
      kcalPer100?: number | null;
      proteinG?: number | null;
      carbsG?: number | null;
      fatG?: number | null;
      fiberG?: number | null;
    };
    if (json.found === false) return null;
    if (typeof json.kcalPer100 !== 'number' || !Number.isFinite(json.kcalPer100)) return null;
    const num = (v: unknown): number | null =>
      typeof v === 'number' && Number.isFinite(v) ? v : null;
    return {
      unit: json.unit === 'ml' ? 'ml' : 'g',
      kcalPer100: json.kcalPer100,
      proteinG: num(json.proteinG),
      carbsG: num(json.carbsG),
      fatG: num(json.fatG),
      fiberG: num(json.fiberG),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
