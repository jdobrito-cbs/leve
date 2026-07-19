import { readRecords } from 'react-native-health-connect';
import { HealthConnectProvider } from '../health/HealthConnectProvider';
import { getHealthProvider } from '../health/HealthProvider';

jest.mock('react-native-health-connect', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  requestPermission: jest.fn().mockResolvedValue([{ recordType: 'Weight' }]),
  readRecords: jest.fn(),
}));

const mockReadRecords = readRecords as jest.Mock;

test('mapeia registros de peso do Health Connect', async () => {
  mockReadRecords.mockResolvedValue({
    records: [
      { weight: { inKilograms: 93.2 }, time: '2026-07-01T10:00:00.000Z' },
      { weight: { inKilograms: null }, time: '2026-07-02T10:00:00.000Z' },
    ],
  });
  const provider = new HealthConnectProvider();
  const samples = await provider.readWeight(new Date(0));
  expect(samples).toEqual([
    { kg: 93.2, takenAt: new Date('2026-07-01T10:00:00.000Z'), source: 'healthconnect' },
  ]);
});

test('agrega passos por dia local', async () => {
  mockReadRecords.mockResolvedValue({
    records: [
      { count: 100, startTime: '2026-07-01T08:00:00.000Z' },
      { count: 200, startTime: '2026-07-01T15:00:00.000Z' },
    ],
  });
  const provider = new HealthConnectProvider();
  const steps = await provider.readSteps(new Date(0));
  expect(steps).toHaveLength(1);
  expect(steps[0].count).toBe(300);
});

test('factory nunca lança e devolve provider seguro sem nativo', async () => {
  const provider = getHealthProvider();
  await expect(provider.isAvailable()).resolves.toBe(false);
  await expect(provider.readWeight(new Date(0))).resolves.toEqual([]);
});
