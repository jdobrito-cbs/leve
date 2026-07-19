import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { strings } from '@/i18n/pt-BR';
import { DoseScreen } from '../DoseScreen';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddDose = jest.fn();
const mockLastSite = jest.fn();
const mockListDoses = jest.fn().mockResolvedValue([]);
const mockDeleteDose = jest.fn();
jest.mock('@/db/doseRepo', () => ({
  addDose: (...a: unknown[]) => mockAddDose(...a),
  lastInjectionSite: (...a: unknown[]) => mockLastSite(...a),
  listDoses: (...a: unknown[]) => mockListDoses(...a),
  deleteDose: (...a: unknown[]) => mockDeleteDose(...a),
}));
jest.mock('@/db/settingsRepo', () => ({
  getSetting: jest.fn().mockResolvedValue(null),
  setSetting: jest.fn(),
}));
const mockGetProfile = jest.fn().mockResolvedValue(null);
jest.mock('@/db/profileRepo', () => ({
  getProfile: (...a: unknown[]) => mockGetProfile(...a),
}));
jest.mock('@/services/reminders/reminders', () => ({ scheduleDoseReminder: jest.fn() }));

test('medicação atual do Perfil vem pré-selecionada no registro', async () => {
  mockGetProfile.mockResolvedValueOnce({ medication: 'Tirzepatida (Mounjaro)' });
  mockLastSite.mockResolvedValue(null);
  mockAddDose.mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText } = await render(<DoseScreen />);
  await fireEvent.changeText(getByPlaceholderText('0,0'), '5');
  await fireEvent.press(getByText(strings.dose.save)); // sem tocar nos chips de medicação
  await waitFor(() =>
    expect(mockAddDose).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ medication: 'tirzepatida', doseMg: 5 }),
    ),
  );
});

test('sugere próximo local do rodízio e salva dose de injeção', async () => {
  mockLastSite.mockResolvedValue('abdomen_sup_e');
  mockAddDose.mockResolvedValue(undefined);
  const { getByText, getAllByText, getByPlaceholderText } = await render(<DoseScreen />);
  await waitFor(() => expect(getAllByText(strings.dose.suggestedLabel).length).toBe(1));
  await fireEvent.press(getByText(strings.dose.medications.semaglutida));
  await fireEvent.changeText(getByPlaceholderText('0,0'), '0,5');
  await fireEvent.press(getByText(strings.dose.save));
  await waitFor(() =>
    expect(mockAddDose).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        medication: 'semaglutida',
        doseMg: 0.5,
        route: 'injecao',
        injectionSite: 'abdomen_sup_d',
        nextDoseAt: expect.any(Date), // intervalo padrão de 7 dias
      }),
    ),
  );
});
