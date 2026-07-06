import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddSymptom = jest.fn();
const mockForDay = jest.fn();
jest.mock('@/db/symptomRepo', () => ({
  addSymptom: (...a: unknown[]) => mockAddSymptom(...a),
  symptomsForDay: (...a: unknown[]) => mockForDay(...a),
}));

import { strings } from '@/i18n/pt-BR';
import { SymptomScreen } from '../SymptomScreen';

test('seleciona sintoma + intensidade e salva', async () => {
  mockForDay.mockResolvedValue([]);
  mockAddSymptom.mockResolvedValue(undefined);
  const { getByText } = await render(<SymptomScreen />);
  await waitFor(() => getByText(strings.symptom.kinds.nausea));
  await fireEvent.press(getByText(strings.symptom.kinds.nausea));
  await fireEvent.press(getByText('3'));
  await fireEvent.press(getByText(strings.symptom.save));
  await waitFor(() =>
    expect(mockAddSymptom).toHaveBeenCalledWith({}, 'nausea', 3, expect.any(Date)),
  );
});
