import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { strings } from '@/i18n/pt-BR';
import { validatePartnerKey } from '@/features/premium/partnerServer';
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
// Mantém formatPartnerKeyInput/isServerPartnerKey reais; só a validação online
// (rede) e o id do aparelho são simulados.
jest.mock('@/features/premium/partnerServer', () => ({
  ...jest.requireActual('@/features/premium/partnerServer'),
  validatePartnerKey: jest.fn(),
  getDeviceId: jest.fn().mockResolvedValue('dev-test'),
}));
const mockValidate = validatePartnerKey as jest.Mock;

beforeEach(() => {
  for (const k of Object.keys(mockStore)) delete mockStore[k];
  mockVerify.mockReset();
  mockValidate.mockReset();
  mockValidate.mockResolvedValue(null); // padrão: sem servidor
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

test('chave de parceiro válida ativa o desbloqueio de parceiro', async () => {
  // O campo formata para LEVE-XXXX-XXXX-XXXX, então o fluxo é o do servidor.
  mockValidate.mockResolvedValue({ valid: true, label: 'Dra. Ana' });
  const { getByText, getByPlaceholderText } = await render(<PremiumScreen />);
  await fireEvent.press(getByText(strings.premium.redeem));
  await fireEvent.changeText(
    getByPlaceholderText(strings.premium.keyPlaceholder),
    'LEVE-7K4M-9QXP-2ATH',
  );
  await fireEvent.press(getByText(strings.common.confirm));
  await waitFor(() => getByText(strings.premium.activeTitle));
  getByText(strings.premium.activePlans.partner);
  expect(mockStore.entitlement).toMatchObject({ plan: 'partner', licenseId: 'Dra. Ana' });
});

test('o campo do código já formata para LEVE-XXXX-XXXX-XXXX', async () => {
  const { getByText, getByPlaceholderText } = await render(<PremiumScreen />);
  await fireEvent.press(getByText(strings.premium.redeem));
  const input = getByPlaceholderText(strings.premium.keyPlaceholder);
  await fireEvent.changeText(input, 'leve7k4m9qxp2ath');
  expect(input.props.value).toBe('LEVE-7K4M-9QXP-2ATH');
});
