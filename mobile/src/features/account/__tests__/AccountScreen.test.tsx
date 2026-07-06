import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('@/services/api/client', () => ({
  isAccountConfigured: () => true,
  AuthError: class extends Error {},
  api: {},
}));

const mockBaseAccount = {
  loading: false,
  busy: false,
  error: null,
  notice: null,
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  backupNow: jest.fn(),
  restore: jest.fn(),
  deleteAccount: jest.fn(),
};
let mockEmail: string | null = null;
jest.mock('@/features/account/useAccount', () => ({
  useAccount: () => ({ ...mockBaseAccount, email: mockEmail }),
}));

import { strings } from '@/i18n/pt-BR';
import { AccountScreen } from '../AccountScreen';

test('deslogado mostra formulário com consentimentos', async () => {
  mockEmail = null;
  const { getByText } = await render(<AccountScreen />);
  getByText(strings.account.register);
  getByText(strings.account.login);
  getByText(strings.account.termsLabel);
  getByText(strings.account.backupConsentLabel);
});

test('logado mostra backup/restaurar/sair/excluir', async () => {
  mockEmail = 'jorge@exemplo.com';
  const { getByText } = await render(<AccountScreen />);
  getByText('jorge@exemplo.com');
  getByText(strings.account.backupNow);
  getByText(strings.account.restore);
  getByText(strings.account.logout);
  getByText(strings.account.deleteAccount);
});
