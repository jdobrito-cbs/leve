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
jest.mock('@/db/foodLogRepo', () => ({
  macrosForDay: jest
    .fn()
    .mockResolvedValue({ kcal: 250, proteinG: 20, carbsG: 30, fatG: 8, fiberG: 5 }),
}));
jest.mock('@/db/weightRepo', () => ({
  firstWeight: jest.fn().mockResolvedValue({ id: 1, weightKg: 100 }),
  listWeights: jest
    .fn()
    .mockResolvedValue([
      { id: 3, weightKg: 93.2 },
      { id: 2, weightKg: 95.5 },
    ]),
}));
jest.mock('@/db/metricsRepo', () => ({
  metricSeries: jest.fn().mockResolvedValue([{ value: 120 }, { value: 200 }]),
  latestMetric: jest.fn().mockResolvedValue({ value: 7.5 }),
}));
jest.mock('@/features/meds/medsRepo', () => ({
  todayIntakes: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/db/doseRepo', () => ({
  latestDose: jest.fn().mockResolvedValue({
    medication: 'semaglutida',
    doseMg: 0.5,
    nextDoseAt: '2026-07-14T12:00:00.000Z',
  }),
  listDoses: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/db/symptomRepo', () => ({
  symptomsForDay: jest.fn().mockResolvedValue([{ kind: 'nausea' }]),
  listSymptoms: jest
    .fn()
    .mockResolvedValue([{ id: 1, kind: 'nausea', intensity: 3, loggedAt: '2026-07-07T09:00:00.000Z' }]),
}));
jest.mock('@/db/settingsRepo', () => ({
  getSetting: jest.fn().mockResolvedValue({ connected: true }),
}));
jest.mock('@/services/health/HealthProvider', () => ({ getHealthProvider: () => ({}) }));
jest.mock('@/features/water/waterGoal', () => ({
  getEffectiveWaterGoal: jest.fn().mockResolvedValue({ goalMl: 2000, auto: false }),
}));
jest.mock('@/features/insights/data', () => ({
  buildInsightInput: jest.fn().mockResolvedValue({
    weights28: [],
    bodyFat28: [],
    muscle28: [],
    bodyWater28: [],
    sleep7: [],
    restingHr7: [],
    restingHr30: [],
    waterPctOfGoal7: [],
  }),
}));
jest.mock('@/services/health/healthSync', () => ({
  readTodaySteps: jest.fn().mockResolvedValue(4200),
  autoSyncIfDue: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/db/profileRepo', () => ({
  getProfile: jest
    .fn()
    .mockResolvedValue({ name: 'Jorge', waterGoalMl: 2000, calorieGoalKcal: null, goalWeightKg: 85 }),
}));

import { useTodaySummary } from '../useTodaySummary';

test('agrega os dados do dia', async () => {
  const { result } = await renderHook(() => useTodaySummary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.waterMl).toBe(500);
  expect(result.current.waterGoalMl).toBe(2000);
  expect(result.current.kcal).toBe(250);
  expect(result.current.lastWeightKg).toBe(93.2);
  // primeiro peso (100) + últimos em ordem cronológica
  expect(result.current.weightSeries.map((w) => w.weightKg)).toEqual([100, 95.5, 93.2]);
  expect(result.current.goalWeightKg).toBe(85);
  expect(result.current.nextDoseAt).toBe('2026-07-14T12:00:00.000Z');
  expect(result.current.symptomsCount).toBe(1);
  expect(result.current.recentSymptoms).toHaveLength(1);
  expect(result.current.userName).toBe('Jorge');
  expect(result.current.steps).toBe(4200);
});
