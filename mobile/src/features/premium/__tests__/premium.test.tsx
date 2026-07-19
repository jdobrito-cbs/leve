import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { strings } from '@/i18n/pt-BR';
import { isLocked } from '../gates';
import { PremiumScreen } from '../PremiumScreen';

jest.mock('@/db/client', () => ({ db: {} }));
const mockStore: Record<string, unknown> = {};
jest.mock('@/db/settingsRepo', () => ({
  getSetting: (_db: unknown, key: string) => Promise.resolve(mockStore[key] ?? null),
  setSetting: (_db: unknown, key: string, value: unknown) => {
    mockStore[key] = value;
    return Promise.resolve();
  },
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      cb();
    }, []);
  },
}));
const mockVerify = jest.fn();
jest.mock('@/features/premium/licenseKey', () => ({
  verifyLicenseKey: (...a: unknown[]) => mockVerify(...a),
}));

beforeEach(() => {
  for (const k of Object.keys(mockStore)) delete mockStore[k];
  mockVerify.mockReset();
});

test('bloqueios configurados: scan e saúde exigem premium; o resto é livre', () => {
  expect(isLocked('scanFood', false)).toBe(true);
  expect(isLocked('healthSync', false)).toBe(true);
  expect(isLocked('insights', false)).toBe(false);
  expect(isLocked('scanFood', true)).toBe(false);
});

test('modal da chave: inválida mostra erro dentro do modal', async () => {
  mockVerify.mockReturnValue(null);
  const { getByText, getByPlaceholderText } = await render(<PremiumScreen />);
  getByText(strings.premium.benefitsTitle);
  await fireEvent.press(getByText(strings.premium.redeem)); // abre o modal
  await fireEvent.changeText(getByPlaceholderText(strings.premium.keyPlaceholder), 'LEVE-x');
  await fireEvent.press(getByText(strings.common.confirm)); // OK
  await waitFor(() => getByText(strings.premium.keyInvalid));
});

test('chave válida no modal ativa o desbloqueio definitivo de parceiro', async () => {
  mockVerify.mockReturnValue('a1b2c3');
  const { getByText, getByPlaceholderText } = await render(<PremiumScreen />);
  await fireEvent.press(getByText(strings.premium.redeem));
  await fireEvent.changeText(
    getByPlaceholderText(strings.premium.keyPlaceholder),
    'LEVE-chave-de-teste',
  );
  await fireEvent.press(getByText(strings.common.confirm));
  await waitFor(() => getByText(strings.premium.activeTitle));
  getByText(strings.premium.activePlans.partner);
  expect(mockStore.entitlement).toMatchObject({ plan: 'partner', licenseId: 'a1b2c3' });
});
