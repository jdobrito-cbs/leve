import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { strings } from '@/i18n/pt-BR';
import { LogHubScreen } from '../LogHubScreen';
import { ProfileScreen } from '../ProfileScreen';
import { ProgressScreen } from '../ProgressScreen';
import { TodayScreen } from '../TodayScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = require('react') as typeof import('react');
    useEffect(cb, []);
  },
}));
jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('@/db/profileRepo', () => ({
  getProfile: jest.fn().mockResolvedValue({ sex: 'feminino' }),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  shareAsync: jest.fn(),
}));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file://cache/',
  writeAsStringAsync: jest.fn(),
}));
const mockExportAll = jest.fn().mockResolvedValue({ version: 1 });
const mockWipeAll = jest.fn();
jest.mock('@/features/backup/exportData', () => ({
  exportAllData: (...a: unknown[]) => mockExportAll(...a),
  wipeAllData: (...a: unknown[]) => mockWipeAll(...a),
}));
jest.mock('react-native-gifted-charts', () => ({
  BarChart: () => null,
  LineChart: () => null,
}));
jest.mock('@/features/progress/useProgressData', () => ({
  useProgressData: () => ({
    loading: false,
    weights: [],
    water7: [],
    kcal7: [],
    doses: [],
    metrics: [],
    workouts: [],
    refresh: jest.fn(),
  }),
}));
const mockSave = jest.fn();
jest.mock('@/features/profile/useProfileForm', () => ({
  useProfileForm: () => ({
    loading: false,
    form: {
      name: 'Jorge',
      sex: 'masculino',
      birthDateStr: '01/01/1990',
      heightStr: '178',
      goalWeightStr: '85',
      doseIntervalStr: '7',
      waterGoalStr: '2000',
      waterGoalAuto: true,
      calorieGoalStr: '',
      doseEnabled: false,
      waterEnabled: false,
      waterTimesStr: '09:00, 13:00, 17:00',
      insightsEnabled: false,
      appointmentsEnabled: false,
    },
    setField: jest.fn(),
    save: mockSave,
    saved: false,
    permissionError: false,
    autoGoalMl: 3250,
  }),
}));
jest.mock('@/features/today/useTodaySummary', () => ({
  useTodaySummary: () => ({
    loading: false,
    userName: 'Jorge',
    waterMl: 1200,
    waterGoalMl: 2000,
    macros: { kcal: 850, proteinG: 62.5, carbsG: 90, fatG: 30, fiberG: 14 },
    kcal: 850,
    calorieGoalKcal: null,
    calorieGoalEffectiveKcal: 2000,
    lastWeightKg: 93.2,
    weightSeries: [
      { id: 1, weightKg: 95.5, origin: 'manual', loggedAt: '2026-06-10T10:00:00.000Z' },
      { id: 2, weightKg: 93.2, origin: 'manual', loggedAt: '2026-07-01T10:00:00.000Z' },
    ],
    goalWeightKg: 85,
    nextDoseAt: '2026-07-14T12:00:00.000Z',
    daysToNextDose: 3,
    lastDoseLabel: 'semaglutida · 0.5 mg',
    doseIntervalDays: 7,
    doses: [
      {
        id: 1,
        medication: 'semaglutida',
        doseMg: 0.5,
        route: 'injecao',
        injectionSite: null,
        loggedAt: '2026-07-01T10:00:00.000Z',
        nextDoseAt: null,
      },
    ],
    symptomsCount: 2,
    recentSymptoms: [
      { id: 2, kind: 'nausea', intensity: 3, loggedAt: '2026-07-07T09:00:00.000Z' },
      { id: 1, kind: 'azia', intensity: 2, loggedAt: '2026-07-06T21:30:00.000Z' },
    ],
    steps: 4200,
    activeCalories: 320,
    healthLatest: {
      sleepHours: 7.2,
      sleepEfficiencyPct: 92,
      breathingDisturbances: null,
      restingHr: 64,
      spo2: 98,
      respiratoryRate: 15,
    },
    intakes: [
      {
        intakeId: 1,
        medicationId: 1,
        name: 'Metformina',
        doseText: '850 mg',
        time: '08:00',
        takenAt: '2026-07-07T08:05:00.000Z',
      },
    ],
    medsToday: { taken: 1, total: 3 },
    insights: [
      { id: 'recomp-positiva', kind: 'positivo', text: 'Seu peso subiu, mas a gordura caiu — contexto positivo.' },
    ],
    refresh: jest.fn(),
  }),
}));
jest.mock('@/features/premium/usePremium', () => ({
  usePremium: () => ({
    loading: false,
    premium: true,
    entitlement: { plan: 'partner' },
    refresh: jest.fn(),
  }),
}));
jest.mock('@/features/health/useHealthConnection', () => ({
  useHealthConnection: () => ({
    loading: false,
    available: true,
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    importNow: jest.fn(),
    importing: false,
    lastImported: null,
  }),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

test('Hoje mostra todos os boxes na nova ordem', async () => {
  const { getByText, getAllByText } = await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <TodayScreen />
    </SafeAreaProvider>,
  );
  getByText('Olá, Jorge!');
  getByText('1.200');
  getByText(strings.today.cards.kcal);
  getByText(strings.today.cards.fiber);
  getByText(strings.today.cards.nextDose);
  getByText(/14\/07\/2026 · \d+d/);
  getByText(strings.today.cards.symptoms);
  getByText(strings.today.medicationSection);
  getByText(strings.today.mealsSection);
  expect(getAllByText(/850/).length).toBeGreaterThanOrEqual(2);
  getByText(/62,5 g/);
  getByText(strings.today.nutrition.fiber);
  getByText(strings.today.activitySection);
  expect(getAllByText(/320 kcal/).length).toBe(2);
  getByText('4.200');
  getByText(strings.today.balanceSection);
  getByText(strings.today.balanceOver);
  getByText(strings.today.balanceGained);
  getByText(strings.today.medRemindersSection);
  getByText(/Metformina/);
  getByText(strings.today.healthSection);
  getByText(/7,2 h/);
  getByText(/64 bpm/);
  getByText(strings.insights.section);
  getByText(/contexto positivo/);
});

test('Registrar lista as 5 categorias e navega nas ativas', async () => {
  const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
  const { getByText } = await render(<LogHubScreen />);
  for (const label of [
    strings.log.water,
    strings.log.meal,
    strings.log.dose,
    strings.log.weight,
    strings.log.symptom,
  ]) {
    getByText(label);
  }
  await waitFor(() => getByText(strings.log.cycle));
  await fireEvent.press(getByText(strings.log.water));
  expect(router.push).toHaveBeenCalledWith('/log/agua');
});

test('Progresso mostra as seções', async () => {
  const { getByText } = await render(<ProgressScreen />);
  getByText(strings.progress.weightSection);
  getByText(strings.progress.dosesSection);
});

test('Perfil mostra metas, lembretes, conta/privacidade e sobre', async () => {
  const { getByText } = await render(<ProfileScreen />);
  getByText(strings.profile.editSection);
  getByText(strings.profile.remindersSection);
  getByText(new RegExp(strings.health.section));
  getByText(strings.health.connect);
  getByText(strings.accountPrivacy.title);
  getByText(strings.about.title);
  await fireEvent.press(getByText(strings.profile.save));
  expect(mockSave).toHaveBeenCalled();
});

test('Conta e privacidade: exportar e excluir funcionam', async () => {
  const { AccountPrivacyScreen } =
    require('@/features/account/AccountPrivacyScreen') as typeof import('@/features/account/AccountPrivacyScreen');
  const { getByText } = await render(<AccountPrivacyScreen />);
  getByText(strings.accountPrivacy.accountSection);

  await fireEvent.press(getByText(strings.profile.exportData));
  expect(mockExportAll).toHaveBeenCalled();

  await fireEvent.press(getByText(strings.profile.deleteData));
  expect(mockWipeAll).not.toHaveBeenCalled();
  await fireEvent.press(getByText(strings.profile.deleteData));
  expect(mockWipeAll).toHaveBeenCalled();
});
