import { addRunPoint, getRunState, resetRun, subscribeRun } from '../runStore';

test('store acumula distância, filtra spike e reseta; notifica ouvintes', () => {
  let hits = 0;
  const off = subscribeRun(() => {
    hits++;
  });
  resetRun(0);
  addRunPoint(0, 0, 0);
  addRunPoint(0.0001, 0, 2000);
  expect(getRunState().points.length).toBe(2);
  expect(getRunState().distanceM).toBeCloseTo(11.1, 0);
  addRunPoint(0.001, 0, 2100); // ~100 m em 0,1 s → spike → ignorado
  expect(getRunState().points.length).toBe(2);
  expect(hits).toBeGreaterThanOrEqual(3);
  resetRun(1000);
  expect(getRunState().points.length).toBe(0);
  expect(getRunState().distanceM).toBe(0);
  off();
});
