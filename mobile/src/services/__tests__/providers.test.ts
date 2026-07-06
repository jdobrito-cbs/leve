import { getHealthProvider } from '../health/HealthProvider';
import { getVisionProvider } from '../vision/VisionProvider';

test('health provider padrão é indisponível mas seguro', async () => {
  const hp = getHealthProvider();
  await expect(hp.isAvailable()).resolves.toBe(false);
  await expect(hp.readWeight(new Date(0))).resolves.toEqual([]);
});

test('vision provider sem EXPO_PUBLIC_SCAN_URL rejeita com mensagem neutra', async () => {
  await expect(getVisionProvider().recognizeFood('file://foto.jpg')).rejects.toThrow(
    /indisponível/i,
  );
});
