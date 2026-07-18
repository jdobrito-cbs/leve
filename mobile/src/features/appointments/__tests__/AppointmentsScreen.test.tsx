import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAdd = jest.fn();
const mockList = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/db/appointmentsRepo', () => ({
  addAppointment: (...a: unknown[]) => mockAdd(...a),
  listAppointments: (...a: unknown[]) => mockList(...a),
  deleteAppointment: (...a: unknown[]) => mockDelete(...a),
}));
jest.mock('@/db/settingsRepo', () => ({
  getSetting: jest.fn().mockResolvedValue({ appointmentsEnabled: true }),
}));
const mockApply = jest.fn();
jest.mock('@/services/reminders/reminders', () => ({
  applyAppointmentReminders: (...a: unknown[]) => mockApply(...a),
  requestNotificationPermission: jest.fn().mockResolvedValue(true),
}));
let mockPremium = true;
jest.mock('@/features/premium/usePremium', () => ({
  usePremium: () => ({
    loading: false,
    premium: mockPremium,
    entitlement: { plan: mockPremium ? 'partner' : 'free' },
    refresh: jest.fn(),
  }),
}));

import { strings } from '@/i18n/pt-BR';
import { AppointmentsScreen } from '../AppointmentsScreen';

beforeEach(() => {
  jest.clearAllMocks();
  mockPremium = true;
  mockList.mockResolvedValue([]);
  mockAdd.mockResolvedValue(undefined);
});

test('campo de outra especialidade só existe com "Outra especialidade" escolhida', async () => {
  const { getByText, queryByText } = await render(<AppointmentsScreen />);
  expect(queryByText(strings.appointments.otherSpecialtyLabel)).toBeNull();
  await fireEvent.press(getByText(strings.appointments.specialties.outra));
  getByText(strings.appointments.otherSpecialtyLabel); // campo apareceu
  await fireEvent.press(getByText(strings.appointments.specialties.cardiologia));
  expect(queryByText(strings.appointments.otherSpecialtyLabel)).toBeNull(); // e sumiu
});

test('salva consulta com especialidade da lista', async () => {
  const { getByText, getByPlaceholderText } = await render(<AppointmentsScreen />);
  await fireEvent.changeText(
    getByPlaceholderText(strings.appointments.placeLabel),
    'Clínica Vida',
  );
  await fireEvent.press(getByText(strings.appointments.specialties.cardiologia));
  await fireEvent.press(getByText(strings.appointments.save));
  await waitFor(() =>
    expect(mockAdd).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        place: 'Clínica Vida',
        specialty: 'Cardiologia',
        doctor: null,
        at: expect.any(Date),
      }),
    ),
  );
  expect(mockApply).toHaveBeenCalled();
});

test('sem premium mostra o convite ao plano', async () => {
  mockPremium = false;
  const { getByText } = await render(<AppointmentsScreen />);
  getByText(strings.premium.appointmentsLockedBody);
  getByText(strings.premium.discover);
});
