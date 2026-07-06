import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      cb();
    }, []);
  },
}));
jest.mock('@/db/waterRepo', () => ({ waterTotalForDay: jest.fn().mockResolvedValue(500) }));
jest.mock('@/db/foodLogRepo', () => ({ kcalForDay: jest.fn().mockResolvedValue(250) }));
jest.mock('@/db/weightRepo', () => ({
  latestWeight: jest.fn().mockResolvedValue({ weightKg: 93.2 }),
}));
jest.mock('@/db/doseRepo', () => ({
  latestDose: jest.fn().mockResolvedValue({
    medication: 'semaglutida',
    doseMg: 0.5,
    nextDoseAt: '2026-07-14T12:00:00.000Z',
  }),
}));
jest.mock('@/db/symptomRepo', () => ({
  symptomsForDay: jest.fn().mockResolvedValue([{ kind: 'nausea' }]),
}));
jest.mock('@/db/profileRepo', () => ({
  getProfile: jest.fn().mockResolvedValue({ waterGoalMl: 2000, calorieGoalKcal: null }),
}));

import { useTodaySummary } from '../useTodaySummary';

test('agrega os dados do dia', async () => {
  const { result } = await renderHook(() => useTodaySummary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.waterMl).toBe(500);
  expect(result.current.waterGoalMl).toBe(2000);
  expect(result.current.kcal).toBe(250);
  expect(result.current.lastWeightKg).toBe(93.2);
  expect(result.current.nextDoseAt).toBe('2026-07-14T12:00:00.000Z');
  expect(result.current.symptomsCount).toBe(1);
});
