import { render } from '@testing-library/react-native';
import { strings } from '@/i18n/pt-BR';
import { LogHubScreen } from '../LogHubScreen';
import { ProfileScreen } from '../ProfileScreen';
import { ProgressScreen } from '../ProgressScreen';
import { TodayScreen } from '../TodayScreen';

test('Hoje mostra empty state', async () => {
  const { getByText } = await render(<TodayScreen />);
  getByText(strings.today.emptyTitle);
});

test('Registrar lista as 5 categorias como "em breve"', async () => {
  const { getByText, getAllByText } = await render(<LogHubScreen />);
  for (const label of [
    strings.log.water,
    strings.log.meal,
    strings.log.dose,
    strings.log.weight,
    strings.log.symptom,
  ]) {
    getByText(label);
  }
  expect(getAllByText(strings.log.comingSoon)).toHaveLength(5);
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
