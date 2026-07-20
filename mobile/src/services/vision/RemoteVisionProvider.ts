import * as FileSystem from 'expo-file-system/legacy';
import { strings } from '@/i18n/pt-BR';
import type { FoodRecognition, VisionProvider } from './VisionProvider';

interface ScanResponse {
  foods?: {
    name: string;
    portionGrams: number | null;
    confidence: number;
    unit?: 'g' | 'ml';
    kcalPer100?: number | null;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
    fiberG?: number | null;
  }[];
}

/** Envia a foto ao servidor do Leve (que guarda a chave do AI Hub). Opt-in por foto. */
export class RemoteVisionProvider implements VisionProvider {
  constructor(
    /** URL COMPLETA do /scan-food (já montada em scanUrl()) — NÃO acrescentar
     *  path aqui, senão vira /scan-food/scan-food e o servidor responde 404. */
    private endpoint: string,
    private appToken?: string,
  ) {}

  async recognizeFood(photoUri: string): Promise<FoodRecognition> {
    const imageBase64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const res = await fetch(this.endpoint, {
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
        unit: f.unit,
        kcalPer100: f.kcalPer100,
        proteinG: f.proteinG,
        carbsG: f.carbsG,
        fatG: f.fatG,
        fiberG: f.fiberG,
      })),
    };
  }
}
