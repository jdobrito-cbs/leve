import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddWeight = jest.fn();
const mockList = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/db/weightRepo', () => ({
  addWeight: (...a: unknown[]) => mockAddWeight(...a),
  listWeights: (...a: unknown[]) => mockList(...a),
  deleteWeight: (...a: unknown[]) => mockDelete(...a),
}));

import { strings } from '@/i18n/pt-BR';
import { WeightScreen } from '../WeightScreen';

test('mostra histórico, salva novo valor com vírgula e apaga registro', async () => {
  mockList.mockResolvedValue([
    { id: 2, weightKg: 93.2, origin: 'manual', loggedAt: '2026-07-01T10:00:00.000Z' },
    { id: 1, weightKg: 95.5, origin: 'manual', loggedAt: '2026-06-10T10:00:00.000Z' },
  ]);
  mockAddWeight.mockResolvedValue(undefined);
  mockDelete.mockResolvedValue(undefined);
  const { getByText, getAllByText, getByPlaceholderText, getAllByLabelText } = await render(
    <WeightScreen />,
  );
  await waitFor(() => getByText(/95,5/));
  expect(getAllByText(/93,2/).length).toBeGreaterThanOrEqual(1);
  await fireEvent.changeText(getByPlaceholderText('0,0'), '92,5');
  await fireEvent.press(getByText(strings.weight.save));
  await waitFor(() => expect(mockAddWeight).toHaveBeenCalledWith({}, 92.5, expect.any(Date)));
  await fireEvent.press(getAllByLabelText(strings.common.deleteEntry)[0]);
  await waitFor(() => expect(mockDelete).toHaveBeenCalledWith({}, 2));
});
