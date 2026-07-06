import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddWater = jest.fn();
const mockTotal = jest.fn();
jest.mock('@/db/waterRepo', () => ({
  addWater: (...a: unknown[]) => mockAddWater(...a),
  waterTotalForDay: (...a: unknown[]) => mockTotal(...a),
}));
jest.mock('@/db/profileRepo', () => ({
  getProfile: jest.fn().mockResolvedValue({ waterGoalMl: 2000 }),
}));

import { strings } from '@/i18n/pt-BR';
import { WaterScreen } from '../WaterScreen';

test('botão rápido registra 200 ml', async () => {
  mockTotal.mockResolvedValue(500);
  mockAddWater.mockResolvedValue(undefined);
  const { getByText } = await render(<WaterScreen />);
  await waitFor(() => getByText(strings.water.quick200));
  await fireEvent.press(getByText(strings.water.quick200));
  await waitFor(() => expect(mockAddWater).toHaveBeenCalledWith({}, 200, expect.any(Date)));
});
