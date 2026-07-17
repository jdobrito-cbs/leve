import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockSearch = jest.fn();
const mockAddFood = jest.fn();
const mockForDay = jest.fn();
const mockDeleteFood = jest.fn();
jest.mock('@/db/foodLogRepo', () => ({
  addFoodLog: (...a: unknown[]) => mockAddFood(...a),
  foodForDay: (...a: unknown[]) => mockForDay(...a),
  deleteFoodLog: (...a: unknown[]) => mockDeleteFood(...a),
}));
jest.mock('@/db/foodItemsRepo', () => ({
  searchFoods: (...a: unknown[]) => mockSearch(...a),
}));
const mockListDishes = jest.fn();
const mockSaveDish = jest.fn();
const mockDeleteDish = jest.fn();
jest.mock('@/db/dishRepo', () => ({
  listDishes: (...a: unknown[]) => mockListDishes(...a),
  saveDish: (...a: unknown[]) => mockSaveDish(...a),
  deleteDish: (...a: unknown[]) => mockDeleteDish(...a),
}));

const mockRecognize = jest.fn();
jest.mock('@/services/vision/VisionProvider', () => ({
  isScanConfigured: () => true,
  getVisionProvider: () => ({ recognizeFood: (...a: unknown[]) => mockRecognize(...a) }),
}));
let mockPremium = true;
jest.mock('@/features/premium/usePremium', () => ({
  usePremium: () => ({
    loading: false,
    premium: mockPremium,
    entitlement: { plan: mockPremium ? 'partner' : 'free' },
    refresh: jest.fn(),
  }),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest
    .fn()
    .mockResolvedValue({ canceled: false, assets: [{ uri: 'file://foto.jpg' }] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn(),
}));

import { strings } from '@/i18n/pt-BR';
import { MealScreen, suggestPeriod } from '../MealScreen';

const FEIJAO = {
  id: 1,
  name: 'Feijão, carioca, cozido',
  category: 'Leguminosas',
  referencePortion: '100 g',
  calories: 76,
  proteinG: 4.8,
  carbsG: 13.6,
  fatG: 0.5,
  fiberG: 8.5,
  source: 'taco',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPremium = true;
  mockForDay.mockResolvedValue([]);
  mockListDishes.mockResolvedValue([]);
  mockAddFood.mockResolvedValue(undefined);
  mockSaveDish.mockResolvedValue(undefined);
});

test('suggestPeriod mapeia hora para período', () => {
  expect(suggestPeriod(7)).toBe('cafe');
  expect(suggestPeriod(12)).toBe('almoco');
  expect(suggestPeriod(16)).toBe('lanche');
  expect(suggestPeriod(20)).toBe('jantar');
  expect(suggestPeriod(23)).toBe('ceia');
});

test('busca TACO → prato → adiciona à refeição com período e valores proporcionais', async () => {
  mockSearch.mockResolvedValue([FEIJAO]);
  const { getByText, getByPlaceholderText, getByDisplayValue } = await render(<MealScreen />);
  await fireEvent.changeText(getByPlaceholderText(strings.meal.searchPlaceholder), 'feijao');
  await waitFor(() => getByText('Feijão, carioca, cozido'));
  await fireEvent.press(getByText('Feijão, carioca, cozido'));
  await waitFor(() => getByDisplayValue('100'));
  await fireEvent.changeText(getByDisplayValue('100'), '200');
  await fireEvent.press(getByText(strings.meal.addToPlate));
  await waitFor(() => getByText(strings.meal.plateSection));
  await fireEvent.press(getByText(strings.meal.addToMeal));
  await waitFor(() =>
    expect(mockAddFood).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        name: 'Feijão, carioca, cozido',
        portionGrams: 200,
        calories: 152,
        period: expect.any(String),
      }),
    ),
  );
});

test('scan: foto → candidato → casa com TACO → prato → salva com origin scan', async () => {
  mockSearch.mockResolvedValue([FEIJAO]);
  mockRecognize.mockResolvedValue({
    label: 'feijão carioca',
    confidence: 0.9,
    candidates: [{ label: 'feijão carioca', confidence: 0.9, portionGrams: 80 }],
  });
  const { getByText, getByDisplayValue } = await render(<MealScreen />);
  await fireEvent.press(getByText(strings.meal.scanTab));
  await fireEvent.press(getByText(strings.meal.scanGallery));
  await waitFor(() => getByText('feijão carioca'));
  await fireEvent.press(getByText('feijão carioca'));
  await waitFor(() => getByDisplayValue('80'));
  await fireEvent.press(getByText(strings.meal.addToPlate));
  await waitFor(() => getByText(strings.meal.plateSection));
  await fireEvent.press(getByText(strings.meal.addToMeal));
  await waitFor(() =>
    expect(mockAddFood).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        name: 'Feijão, carioca, cozido',
        portionGrams: 80,
        origin: 'scan',
      }),
    ),
  );
});

test('modo manual: peso digitado + base TACO calculam as calorias', async () => {
  mockSearch.mockResolvedValue([FEIJAO]);
  const { getByText, getByPlaceholderText } = await render(<MealScreen />);
  await fireEvent.press(getByText(strings.meal.manualTab));
  await fireEvent.changeText(getByPlaceholderText(strings.meal.nameLabel), 'Feijão de casa');
  await waitFor(() => getByText(new RegExp(strings.meal.baseLabel)));
  await fireEvent.changeText(getByPlaceholderText('0'), '200');
  await fireEvent.press(getByText(strings.meal.addToPlate));
  await waitFor(() => getByText(strings.meal.plateSection));
  await fireEvent.press(getByText(strings.meal.addToMeal));
  await waitFor(() =>
    expect(mockAddFood).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ name: 'Feijão de casa', portionGrams: 200, calories: 152 }),
    ),
  );
});

test('sem premium, tocar no scan leva à tela de assinatura', async () => {
  mockPremium = false;
  const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
  const { getByText } = await render(<MealScreen />);
  await fireEvent.press(getByText(new RegExp(strings.meal.scanTab)));
  expect(router.push).toHaveBeenCalledWith('/assinatura');
  expect(mockRecognize).not.toHaveBeenCalled();
});

test('salvar prato persiste modelo reutilizável', async () => {
  mockSearch.mockResolvedValue([FEIJAO]);
  const { getByText, getByPlaceholderText, getByDisplayValue } = await render(<MealScreen />);
  await fireEvent.changeText(getByPlaceholderText(strings.meal.searchPlaceholder), 'feijao');
  await waitFor(() => getByText('Feijão, carioca, cozido'));
  await fireEvent.press(getByText('Feijão, carioca, cozido'));
  await waitFor(() => getByDisplayValue('100'));
  await fireEvent.press(getByText(strings.meal.addToPlate));
  await waitFor(() => getByText(strings.meal.plateSection));
  await fireEvent.changeText(getByPlaceholderText(strings.meal.plateNameLabel), 'Almoço básico');
  await fireEvent.press(getByText(strings.meal.savePlate));
  await waitFor(() =>
    expect(mockSaveDish).toHaveBeenCalledWith(
      {},
      'Almoço básico',
      [expect.objectContaining({ name: 'Feijão, carioca, cozido', grams: 100, calories: 76 })],
      expect.any(Date),
    ),
  );
  await waitFor(() => getByText(strings.meal.plateSaved));
});
