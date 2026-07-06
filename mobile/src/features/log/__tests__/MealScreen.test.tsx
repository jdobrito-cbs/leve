import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockSearch = jest.fn();
const mockAddFood = jest.fn();
const mockForDay = jest.fn();
const mockKcalDay = jest.fn();
jest.mock('@/db/foodItemsRepo', () => ({
  searchFoods: (...a: unknown[]) => mockSearch(...a),
}));
jest.mock('@/db/foodLogRepo', () => ({
  addFoodLog: (...a: unknown[]) => mockAddFood(...a),
  foodForDay: (...a: unknown[]) => mockForDay(...a),
  kcalForDay: (...a: unknown[]) => mockKcalDay(...a),
}));

import { strings } from '@/i18n/pt-BR';
import { MealScreen } from '../MealScreen';

const FEIJAO = {
  id: 1,
  name: 'Feijão, carioca, cozido',
  category: 'Leguminosas',
  referencePortion: '100 g',
  calories: 76,
  proteinG: 4.8,
  carbsG: 13.6,
  fatG: 0.5,
  source: 'taco',
};

beforeEach(() => {
  mockForDay.mockResolvedValue([]);
  mockKcalDay.mockResolvedValue(0);
  mockAddFood.mockResolvedValue(undefined);
});

test('busca TACO, ajusta porção e adiciona com valores proporcionais', async () => {
  mockSearch.mockResolvedValue([FEIJAO]);
  const { getByText, getByPlaceholderText, getByDisplayValue } = await render(<MealScreen />);
  await fireEvent.changeText(getByPlaceholderText(strings.meal.searchPlaceholder), 'feijao');
  await waitFor(() => getByText('Feijão, carioca, cozido'));
  await fireEvent.press(getByText('Feijão, carioca, cozido'));
  await waitFor(() => getByDisplayValue('100'));
  await fireEvent.changeText(getByDisplayValue('100'), '200');
  await fireEvent.press(getByText(strings.meal.add));
  await waitFor(() =>
    expect(mockAddFood).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        name: 'Feijão, carioca, cozido',
        portionGrams: 200,
        calories: 152,
      }),
    ),
  );
});

test('modo manual adiciona com kcal digitadas', async () => {
  const { getByText, getByPlaceholderText } = await render(<MealScreen />);
  await fireEvent.press(getByText(strings.meal.manualTab));
  await fireEvent.changeText(getByPlaceholderText(strings.meal.nameLabel), 'Marmita');
  await fireEvent.changeText(getByPlaceholderText(strings.meal.kcalLabel), '450');
  await fireEvent.press(getByText(strings.meal.add));
  await waitFor(() =>
    expect(mockAddFood).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ name: 'Marmita', calories: 450 }),
    ),
  );
});
