import { getMascot, MASCOT_EVENT_MS, setMascotEvent } from '../mascotSignal';

jest.useFakeTimers();

test('padrão é o panda feliz e eventos expiram sozinhos', () => {
  expect(getMascot()).toBe('happy');

  setMascotEvent('hydrated');
  expect(getMascot()).toBe('hydrated');

  jest.advanceTimersByTime(MASCOT_EVENT_MS);
  expect(getMascot()).toBe('happy');
});

test('evento novo substitui o anterior e renova o tempo', () => {
  setMascotEvent('thirsty');
  jest.advanceTimersByTime(MASCOT_EVENT_MS / 2);

  setMascotEvent('hydrated');
  jest.advanceTimersByTime(MASCOT_EVENT_MS / 2);
  expect(getMascot()).toBe('hydrated');

  jest.advanceTimersByTime(MASCOT_EVENT_MS / 2);
  expect(getMascot()).toBe('happy');
});
