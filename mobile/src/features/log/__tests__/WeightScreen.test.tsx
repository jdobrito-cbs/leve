import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddWeight = jest.fn();
const mockLatest = jest.fn();
jest.mock('@/db/weightRepo', () => ({
  addWeight: (...a: unknown[]) => mockAddWeight(...a),
  latestWeight: (...a: unknown[]) => mockLatest(...a),
}));

import { strings } from '@/i18n/pt-BR';
import { WeightScreen } from '../WeightScreen';

test('mostra último peso e salva novo valor com vírgula', async () => {
  mockLatest.mockResolvedValue({ weightKg: 93.2, loggedAt: '2026-07-01T10:00:00.000Z' });
  mockAddWeight.mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText } = await render(<WeightScreen />);
  await waitFor(() => getByText(/93,2/));
  await fireEvent.changeText(getByPlaceholderText('0,0'), '92,5');
  await fireEvent.press(getByText(strings.weight.save));
  await waitFor(() => expect(mockAddWeight).toHaveBeenCalledWith({}, 92.5, expect.any(Date)));
});
