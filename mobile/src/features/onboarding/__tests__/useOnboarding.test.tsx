import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
const mockGetProfile = jest.fn();
const mockAcceptDisclaimer = jest.fn();
jest.mock('@/db/profileRepo', () => ({
  getProfile: (...a: unknown[]) => mockGetProfile(...a),
  acceptDisclaimer: (...a: unknown[]) => mockAcceptDisclaimer(...a),
}));

import { useOnboarding } from '../useOnboarding';

test('sem perfil → não aceito; accept() persiste e atualiza', async () => {
  mockGetProfile.mockResolvedValue(null);
  const { result } = await renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.accepted).toBe(false);

  mockAcceptDisclaimer.mockResolvedValue(undefined);
  await act(() => result.current.accept());
  expect(mockAcceptDisclaimer).toHaveBeenCalled();
  expect(result.current.accepted).toBe(true);
});

test('perfil com aceite → accepted true', async () => {
  mockGetProfile.mockResolvedValue({ id: 1, disclaimerAcceptedAt: '2026-07-06T12:00:00Z' });
  const { result } = await renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.accepted).toBe(true));
});
