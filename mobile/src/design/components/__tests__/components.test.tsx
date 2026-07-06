import { fireEvent, render } from '@testing-library/react-native';
import { Sprout } from 'lucide-react-native';
import { strings } from '@/i18n/pt-BR';
import { Button, DisclaimerBanner, EmptyState } from '../index';

test('DisclaimerBanner mostra o texto canônico', async () => {
  const { getByText } = await render(<DisclaimerBanner />);
  getByText(strings.disclaimer.medical);
});

test('Button dispara onPress e respeita disabled', async () => {
  const onPress = jest.fn();
  const { getByText, rerender } = await render(<Button label="Ok" onPress={onPress} />);
  await fireEvent.press(getByText('Ok'));
  expect(onPress).toHaveBeenCalledTimes(1);
  await rerender(<Button label="Ok" onPress={onPress} disabled />);
  await fireEvent.press(getByText('Ok'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('EmptyState renderiza título e dica', async () => {
  const { getByText } = await render(<EmptyState title="Vazio" hint="Dica" Icon={Sprout} />);
  getByText('Vazio');
  getByText('Dica');
});
