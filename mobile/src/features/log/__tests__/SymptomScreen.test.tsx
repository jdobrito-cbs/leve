import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { strings } from '@/i18n/pt-BR';
import { SymptomScreen } from '../SymptomScreen';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddSymptom = jest.fn();
const mockList = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/db/symptomRepo', () => ({
  addSymptom: (...a: unknown[]) => mockAddSymptom(...a),
  listSymptoms: (...a: unknown[]) => mockList(...a),
  deleteSymptom: (...a: unknown[]) => mockDelete(...a),
}));

test('seleciona sintoma + intensidade e salva', async () => {
  mockList.mockResolvedValue([]);
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
