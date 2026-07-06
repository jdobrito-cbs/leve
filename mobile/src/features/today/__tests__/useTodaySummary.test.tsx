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
  weightsSince: jest.fn().mockResolvedValue([{ weightKg: 95.5 }, { weightKg: 93.2 }]),
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
jest.mock('@/db/settingsRepo', () => ({
  getSetting: jest.fn().mockResolvedValue({ connected: true }),
}));
jest.mock('@/services/health/HealthProvider', () => ({ getHealthProvider: () => ({}) }));
jest.mock('@/features/water/waterGoal', () => ({
  getEffectiveWaterGoal: jest.fn().mockResolvedValue({ goalMl: 2000, auto: false }),
}));
jest.mock('@/services/health/healthSync', () => ({
  readTodaySteps: jest.fn().mockResolvedValue(4200),
}));
jest.mock('@/db/profileRepo', () => ({
  getProfile: jest
    .fn()
    .mockResolvedValue({ waterGoalMl: 2000, calorieGoalKcal: null, goalWeightKg: 85 }),
}));

import { useTodaySummary } from '../useTodaySummary';

test('agrega os dados do dia', async () => {
  const { result } = await renderHook(() => useTodaySummary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.waterMl).toBe(500);
  expect(result.current.waterGoalMl).toBe(2000);
  expect(result.current.kcal).toBe(250);
  expect(result.current.lastWeightKg).toBe(93.2);
  expect(result.current.weights30).toHaveLength(2);
  expect(result.current.goalWeightKg).toBe(85);
  expect(result.current.nextDoseAt).toBe('2026-07-14T12:00:00.000Z');
  expect(result.current.symptomsCount).toBe(1);
  expect(result.current.steps).toBe(4200);
});
