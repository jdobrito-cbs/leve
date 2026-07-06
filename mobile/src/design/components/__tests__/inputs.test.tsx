import { fireEvent, render } from '@testing-library/react-native';
import { ListRow, NumberField, SegmentedChips } from '../index';

test('SegmentedChips seleciona opção', async () => {
  const onChange = jest.fn();
  const { getByText } = await render(
    <SegmentedChips
      options={[
        { value: 'a', label: 'Opção A' },
        { value: 'b', label: 'Opção B' },
      ]}
      value="a"
      onChange={onChange}
    />,
  );
  await fireEvent.press(getByText('Opção B'));
  expect(onChange).toHaveBeenCalledWith('b');
});

test('NumberField repassa texto e mostra sufixo', async () => {
  const onChangeText = jest.fn();
  const { getByPlaceholderText, getByText } = await render(
    <NumberField label="Peso" value="" onChangeText={onChangeText} suffix="kg" placeholder="0,0" />,
  );
  await fireEvent.changeText(getByPlaceholderText('0,0'), '92,5');
  expect(onChangeText).toHaveBeenCalledWith('92,5');
  getByText('kg');
});

test('ListRow renderiza título/subtítulo/right', async () => {
  const { getByText } = await render(<ListRow title="Arroz" subtitle="150 g" right="190 kcal" />);
  getByText('Arroz');
  getByText('150 g');
  getByText('190 kcal');
});
