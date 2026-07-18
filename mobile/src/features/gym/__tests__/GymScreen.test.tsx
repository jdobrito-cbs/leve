import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
const mockAdd = jest.fn();
const mockList = jest.fn();
const mockDayKcal = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/db/gymRepo', () => ({
  addGymLog: (...a: unknown[]) => mockAdd(...a),
  listGymLogs: (...a: unknown[]) => mockList(...a),
  gymKcalForDay: (...a: unknown[]) => mockDayKcal(...a),
  deleteGymLog: (...a: unknown[]) => mockDelete(...a),
}));
jest.mock('@/db/weightRepo', () => ({
  latestWeight: jest.fn().mockResolvedValue({ weightKg: 100 }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      cb();
    }, []);
  },
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
import { GymScreen } from '../GymScreen';

beforeEach(() => {
  jest.clearAllMocks();
  mockPremium = true;
  mockList.mockResolvedValue([]);
  mockDayKcal.mockResolvedValue(0);
  mockAdd.mockResolvedValue(undefined);
});

test('sem premium, a academia mostra o convite ao plano', async () => {
  mockPremium = false;
  const { getByText } = await render(<GymScreen />);
  getByText(strings.premium.gymLockedBody);
  getByText(strings.premium.discover);
});

test('força: preenche peso/séries/repetições, estima kcal e salva', async () => {
  const { getByText, getByPlaceholderText } = await render(<GymScreen />);
  getByText(strings.gym.title);
  await fireEvent.changeText(getByPlaceholderText('0'), '40');
  await waitFor(() => getByText(/Calorias estimadas/));
  await fireEvent.press(getByText(strings.gym.save));
  await waitFor(() =>
    expect(mockAdd).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        exercise: 'supino',
        kind: 'forca',
        weightKg: 40,
        sets: 3,
        reps: 12,
        kcal: expect.any(Number),
        at: expect.any(Date),
      }),
    ),
  );
});

test('cardio: escolhe dança, informa minutos e salva com kcal por METs', async () => {
  const { getByText, getByPlaceholderText } = await render(<GymScreen />);
  await fireEvent.press(getByText(strings.gym.exercises.danca));
  await fireEvent.changeText(getByPlaceholderText('30'), '45');
  await fireEvent.press(getByText(strings.gym.save));
  await waitFor(() =>
    expect(mockAdd).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        exercise: 'danca',
        kind: 'cardio',
        minutes: 45,
        sets: null,
        kcal: expect.any(Number),
      }),
    ),
  );
});
