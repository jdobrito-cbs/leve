import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/db/client', () => ({ db: {} }));
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
    refresh: jest.fn(),
  }),
}));
const mockSave = jest.fn();
jest.mock('@/features/profile/useProfileForm', () => ({
  useProfileForm: () => ({
    loading: false,
    form: {
      name: 'Jorge',
      heightStr: '178',
      medication: 'semaglutida',
      goalWeightStr: '85',
      waterGoalStr: '2000',
      waterGoalAuto: true,
      calorieGoalStr: '',
      doseEnabled: false,
      waterEnabled: false,
      waterTimesStr: '09:00, 13:00, 17:00',
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
    waterMl: 1200,
    waterGoalMl: 2000,
    kcal: 850,
    calorieGoalKcal: null,
    lastWeightKg: 93.2,
    weights30: [
      { id: 1, weightKg: 95.5, origin: 'manual', loggedAt: '2026-06-10T10:00:00.000Z' },
      { id: 2, weightKg: 93.2, origin: 'manual', loggedAt: '2026-07-01T10:00:00.000Z' },
    ],
    goalWeightKg: 85,
    nextDoseAt: null,
    lastDoseLabel: 'semaglutida · 0.5 mg',
    symptomsCount: 2,
    steps: 4200,
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
import { strings } from '@/i18n/pt-BR';
import { LogHubScreen } from '../LogHubScreen';
import { ProfileScreen } from '../ProfileScreen';
import { ProgressScreen } from '../ProgressScreen';
import { TodayScreen } from '../TodayScreen';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

test('Hoje mostra anel de água e cards do dia', async () => {
  const { getByText } = await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <TodayScreen />
    </SafeAreaProvider>,
  );
  getByText('1.200');
  getByText(strings.today.waterRing);
  getByText(strings.today.weightSection);
  getByText(strings.today.cards.kcal);
  getByText(strings.today.cards.nextDose);
  getByText(strings.today.cards.symptoms);
  getByText(/93,2/);
  getByText(/Meta.*85/);
  getByText(strings.today.cards.steps);
  getByText('4.200');
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
  await fireEvent.press(getByText(strings.log.water));
  expect(router.push).toHaveBeenCalledWith('/log/agua');
});

test('Progresso mostra as seções', async () => {
  const { getByText } = await render(<ProgressScreen />);
  getByText(strings.progress.weightSection);
  getByText(strings.progress.dosesSection);
});

test('Perfil mostra metas, lembretes, conta e privacidade; exportar e excluir funcionam', async () => {
  const { getByText } = await render(<ProfileScreen />);
  getByText(strings.profile.editSection);
  getByText(strings.profile.remindersSection);
  getByText(new RegExp(strings.health.section));
  getByText(strings.health.connect);
  getByText(strings.account.section);
  getByText(strings.profile.privacySection);
  await fireEvent.press(getByText(strings.profile.save));
  expect(mockSave).toHaveBeenCalled();

  await fireEvent.press(getByText(strings.profile.exportData));
  expect(mockExportAll).toHaveBeenCalled();

  await fireEvent.press(getByText(strings.profile.deleteData));
  expect(mockWipeAll).not.toHaveBeenCalled(); // primeiro toque só pede confirmação
  await fireEvent.press(getByText(strings.profile.deleteData));
  expect(mockWipeAll).toHaveBeenCalled();
});
