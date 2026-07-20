export interface FoodCandidate {
  label: string;
  confidence: number;
  portionGrams?: number | null;
  unit?: 'g' | 'ml';
  kcalPer100?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
}

export interface FoodRecognition {
  label: string;
  confidence: number;
  candidates: FoodCandidate[];
}

export interface VisionProvider {
  recognizeFood(photoUri: string): Promise<FoodRecognition>;
}

export class UnconfiguredVisionProvider implements VisionProvider {
  async recognizeFood(): Promise<FoodRecognition> {
    throw new Error('Scan indisponível nesta versão');
  }
}

function scanUrl(): string | null {
  if (process.env.EXPO_PUBLIC_SCAN_URL) return process.env.EXPO_PUBLIC_SCAN_URL;
  const base = process.env.EXPO_PUBLIC_LEVE_SERVER_URL;
  return base ? `${base.replace(/\/$/, '')}/scan-food` : null;
}

export function isScanConfigured(): boolean {
  return Boolean(scanUrl());
}

export function getVisionProvider(): VisionProvider {
  const url = scanUrl();
  if (url) {
    const { RemoteVisionProvider } =
      require('./RemoteVisionProvider') as typeof import('./RemoteVisionProvider');
    return new RemoteVisionProvider(url, process.env.EXPO_PUBLIC_SCAN_TOKEN);
  }
  return new UnconfiguredVisionProvider();
}
