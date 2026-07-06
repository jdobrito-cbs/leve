export interface FoodRecognition {
  label: string;
  confidence: number; // 0..1
  candidates: Array<{ label: string; confidence: number }>;
}

export interface VisionProvider {
  recognizeFood(photoUri: string): Promise<FoodRecognition>;
}

/** Padrão até a Fase 3 (AI Hub do dono ou API de visão externa). */
export class UnconfiguredVisionProvider implements VisionProvider {
  async recognizeFood(): Promise<FoodRecognition> {
    throw new Error('Scan de comida chega na Fase 3');
  }
}

export function getVisionProvider(): VisionProvider {
  return new UnconfiguredVisionProvider();
}
