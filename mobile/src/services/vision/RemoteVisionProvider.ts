import * as FileSystem from 'expo-file-system/legacy';
import { strings } from '@/i18n/pt-BR';
import type { FoodRecognition, VisionProvider } from './VisionProvider';

interface ScanResponse {
  foods?: Array<{ name: string; portionGrams: number | null; confidence: number }>;
}

/** Envia a foto ao servidor do Leve (que guarda a chave do AI Hub). Opt-in por foto. */
export class RemoteVisionProvider implements VisionProvider {
  constructor(
    private baseUrl: string,
    private appToken?: string,
  ) {}

  async recognizeFood(photoUri: string): Promise<FoodRecognition> {
    const imageBase64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/scan-food`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.appToken ? { 'x-leve-app': this.appToken } : {}),
      },
      body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
    });
    if (!res.ok) throw new Error(strings.meal.scanFailed);
    const json = (await res.json()) as ScanResponse;
    const foods = json.foods ?? [];
    if (foods.length === 0) throw new Error(strings.meal.scanNoFood);
    return {
      label: foods[0].name,
      confidence: foods[0].confidence,
      candidates: foods.map((f) => ({
        label: f.name,
        confidence: f.confidence,
        portionGrams: f.portionGrams,
      })),
    };
  }
}
