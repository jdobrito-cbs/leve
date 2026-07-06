import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('react-native-gifted-charts', () => ({
  BarChart: () => null,
  LineChart: () => null,
}));

const mockData = {
  loading: false,
  weights: [
    { id: 1, weightKg: 95.5, origin: 'manual', loggedAt: '2026-06-01T10:00:00.000Z' },
    { id: 2, weightKg: 93.2, origin: 'manual', loggedAt: '2026-07-01T10:00:00.000Z' },
  ],
  water7: [{ dayKey: '2026-07-07', totalMl: 1200 }],
  kcal7: [{ dayKey: '2026-07-07', kcal: 850 }],
  doses: [
    {
      id: 1,
      medication: 'semaglutida',
      doseMg: 0.5,
      route: 'injecao',
      injectionSite: 'abdomen_e',
      loggedAt: '2026-07-01T10:00:00.000Z',
      nextDoseAt: null,
    },
  ],
  refresh: jest.fn(),
};
jest.mock('../useProgressData', () => ({ useProgressData: () => mockData }));

import { strings } from '@/i18n/pt-BR';
import { ProgressScreen } from '@/features/screens/ProgressScreen';

test('mostra seções e histórico de doses', async () => {
  const { getByText, getAllByText } = await render(<ProgressScreen />);
  getByText(strings.progress.pkSection);
  getByText(strings.progress.pkDisclaimer);
  getByText(/nível relativo/);
  getByText(strings.progress.weightSection);
  getByText(strings.progress.waterSection);
  getByText(strings.progress.kcalSection);
  getByText(strings.progress.dosesSection);
  expect(getAllByText(/semaglutida/).length).toBeGreaterThanOrEqual(2); // curva PK + histórico
});

test('sem dados mostra estados vazios', async () => {
  mockData.weights = [];
  mockData.water7 = [];
  mockData.kcal7 = [];
  mockData.doses = [];
  const { getAllByText } = await render(<ProgressScreen />);
  expect(getAllByText(strings.progress.empty).length).toBeGreaterThanOrEqual(3);
});
