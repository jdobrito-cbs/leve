import { strings } from '@/i18n/pt-BR';
import { RemoteVisionProvider } from '../RemoteVisionProvider';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64-da-foto'),
  EncodingType: { Base64: 'base64' },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as never;

beforeEach(() => mockFetch.mockReset());

test('mapeia resposta do servidor para FoodRecognition', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      foods: [
        { name: 'arroz branco cozido', portionGrams: 150, confidence: 0.9 },
        { name: 'feijão carioca', portionGrams: 80, confidence: 0.7 },
      ],
    }),
  });
  // Recebe a URL COMPLETA do scan (como em produção) e a usa direto, sem
  // acrescentar path — senão viraria /scan-food/scan-food (o bug corrigido).
  const provider = new RemoteVisionProvider('https://levemobile.com.br/scan-food');
  const result = await provider.recognizeFood('file://foto.jpg');
  expect(result.label).toBe('arroz branco cozido');
  expect(result.candidates).toHaveLength(2);
  expect(result.candidates[1].portionGrams).toBe(80);
  expect(mockFetch.mock.calls[0][0]).toBe('https://levemobile.com.br/scan-food');
});

test('erro do servidor e foto sem comida lançam mensagens neutras', async () => {
  mockFetch.mockResolvedValue({ ok: false, status: 502 });
  const provider = new RemoteVisionProvider('https://levemobile.com.br/scan-food');
  await expect(provider.recognizeFood('file://x.jpg')).rejects.toThrow(strings.meal.scanFailed);

  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ foods: [] }) });
  await expect(provider.recognizeFood('file://x.jpg')).rejects.toThrow(strings.meal.scanNoFood);
});
