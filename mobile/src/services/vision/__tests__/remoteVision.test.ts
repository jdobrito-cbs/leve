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
  const provider = new RemoteVisionProvider('https://levemobile.com.br/scan-food');
  const result = await provider.recognizeFood('file://foto.jpg');
  expect(result.label).toBe('arroz branco cozido');
  expect(result.candidates).toHaveLength(2);
  expect(result.candidates[1].portionGrams).toBe(80);
  expect(mockFetch.mock.calls[0][0]).toBe('https://levemobile.com.br/scan-food');
});

test('repassa a nutrição estimada da foto para o candidato', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      foods: [
        { name: 'arroz', portionGrams: 150, confidence: 0.9, unit: 'g', kcalPer100: 128, proteinG: 2.5 },
      ],
    }),
  });
  const provider = new RemoteVisionProvider('https://levemobile.com.br/scan-food');
  const { candidates } = await provider.recognizeFood('file://foto.jpg');
  expect(candidates[0]).toMatchObject({ kcalPer100: 128, proteinG: 2.5, unit: 'g' });
});

test('erro do servidor e foto sem comida lançam mensagens neutras', async () => {
  mockFetch.mockResolvedValue({ ok: false, status: 502 });
  const provider = new RemoteVisionProvider('https://levemobile.com.br/scan-food');
  await expect(provider.recognizeFood('file://x.jpg')).rejects.toThrow(strings.meal.scanFailed);

  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ foods: [] }) });
  await expect(provider.recognizeFood('file://x.jpg')).rejects.toThrow(strings.meal.scanNoFood);
});

test('422 com motivo de demora vira mensagem de timeout', async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 422,
    json: async () => ({ error: 'x', reason: 'a IA demorou demais (tempo esgotado)' }),
  });
  const provider = new RemoteVisionProvider('https://levemobile.com.br/scan-food');
  await expect(provider.recognizeFood('file://x.jpg')).rejects.toThrow(strings.meal.scanTimeout);
});
