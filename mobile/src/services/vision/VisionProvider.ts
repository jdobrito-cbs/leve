export interface FoodCandidate {
  label: string;
  confidence: number; // 0..1
  portionGrams?: number | null;
}

export interface FoodRecognition {
  label: string;
  confidence: number; // 0..1
  candidates: FoodCandidate[];
}

export interface VisionProvider {
  recognizeFood(photoUri: string): Promise<FoodRecognition>;
}

/** Usado quando o app foi buildado sem EXPO_PUBLIC_SCAN_URL. */
export class UnconfiguredVisionProvider implements VisionProvider {
  async recognizeFood(): Promise<FoodRecognition> {
    throw new Error('Scan indisponível nesta versão');
  }
}

export function isScanConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SCAN_URL);
}

export function getVisionProvider(): VisionProvider {
  const url = process.env.EXPO_PUBLIC_SCAN_URL;
  if (url) {
    const { RemoteVisionProvider } =
      require('./RemoteVisionProvider') as typeof import('./RemoteVisionProvider');
    return new RemoteVisionProvider(url, process.env.EXPO_PUBLIC_SCAN_TOKEN);
  }
  return new UnconfiguredVisionProvider();
}
