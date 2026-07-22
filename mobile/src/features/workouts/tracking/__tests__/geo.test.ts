import { haversineM, routeDistanceM, stepDistanceM } from '../geo';

test('haversine: ~111 m por 0,001° de latitude; zero na mesma posição', () => {
  expect(haversineM({ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 })).toBeCloseTo(111.2, 0);
  expect(haversineM({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBe(0);
});

test('stepDistance filtra jitter (<2 m) e spikes (>12 m/s)', () => {
  expect(stepDistanceM({ lat: 0, lng: 0, t: 0 }, { lat: 0.00001, lng: 0, t: 1000 })).toBe(0);
  expect(stepDistanceM({ lat: 0, lng: 0, t: 0 }, { lat: 0.001, lng: 0, t: 1000 })).toBe(0);
  expect(stepDistanceM({ lat: 0, lng: 0, t: 0 }, { lat: 0.0001, lng: 0, t: 2000 })).toBeCloseTo(
    11.1,
    0,
  );
});

test('routeDistance soma os trechos', () => {
  expect(
    routeDistanceM([
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0 },
      { lat: 0.002, lng: 0 },
    ]),
  ).toBeCloseTo(222.4, 0);
});
