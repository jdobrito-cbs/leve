import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('@/features/today/useTodaySummary', () => ({
  useTodaySummary: () => ({
    loading: false,
    waterMl: 1200,
    waterGoalMl: 2000,
    kcal: 850,
    calorieGoalKcal: null,
    lastWeightKg: 93.2,
    nextDoseAt: null,
    lastDoseLabel: 'semaglutida · 0.5 mg',
    symptomsCount: 2,
    refresh: jest.fn(),
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
  getByText(strings.today.cards.kcal);
  getByText(strings.today.cards.nextDose);
  getByText(strings.today.cards.lastWeight);
  getByText(strings.today.cards.symptoms);
  getByText(/93,2/);
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

test('Progresso mostra empty state', async () => {
  const { getByText } = await render(<ProgressScreen />);
  getByText(strings.progress.emptyTitle);
});

test('Perfil mostra seção de privacidade com exportar/excluir', async () => {
  const { getByText } = await render(<ProfileScreen />);
  getByText(strings.profile.privacySection);
  getByText(strings.profile.exportData);
  getByText(strings.profile.deleteData);
});
