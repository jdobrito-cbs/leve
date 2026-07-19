import { fireEvent, render, waitFor } from '@testing-library/react-native';


import { WaterScreen } from '../WaterScreen';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddWater = jest.fn();
const mockTotal = jest.fn();
jest.mock('@/db/waterRepo', () => ({
  addWater: (...a: unknown[]) => mockAddWater(...a),
  waterTotalForDay: (...a: unknown[]) => mockTotal(...a),
}));
jest.mock('@/features/water/waterGoal', () => ({
  getEffectiveWaterGoal: jest.fn().mockResolvedValue({ goalMl: 2000, auto: true }),
}));

test('botão rápido registra 200 ml', async () => {
  mockTotal.mockResolvedValue(500);
  mockAddWater.mockResolvedValue(undefined);
  const { getByText } = await render(<WaterScreen />);
  // Rótulo montado por formatVolume (métrico nos testes): "+ 200 ml".
  await waitFor(() => getByText('+ 200 ml'));
  await fireEvent.press(getByText('+ 200 ml'));
  await waitFor(() => expect(mockAddWater).toHaveBeenCalledWith({}, 200, expect.any(Date)));
});
