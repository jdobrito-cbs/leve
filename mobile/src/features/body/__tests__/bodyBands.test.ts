import {
  bmiZones,
  componentBandKg,
  fatPctZones,
  gaugeBoundaryFractions,
  gaugeMarkerFraction,
  idealWeightBounds,
  visceralZones,
  whrZones,
  zoneOf,
} from '../bodyBands';

test('faixas masculinas reproduzem os medidores da balança (1,82 m)', () => {
  const ideal = idealWeightBounds(182);
  expect(ideal.min).toBeCloseTo(61.3, 1);
  expect(ideal.max).toBeCloseTo(82.8, 1);

  const muscle = componentBandKg('masculino', 182, 'muscle');
  expect(muscle.min).toBeCloseTo(49.2, 1);
  expect(muscle.max).toBeCloseTo(61.2, 1);

  const protein = componentBandKg('masculino', 182, 'protein');
  expect(protein.min).toBeCloseTo(10.5, 1);
  expect(protein.max).toBeCloseTo(13.2, 1);

  const water = componentBandKg('masculino', 182, 'water');
  expect(water.min).toBeCloseTo(38.6, 1);
  expect(water.max).toBeCloseTo(48.0, 1);
});

test('geometria dos medidores é a da balança: zonas iguais e marcador interno', () => {
  const fat = fatPctZones('masculino');
  expect(gaugeBoundaryFractions(fat)).toEqual([0.25, 0.5, 0.75]);

  const fatPos = gaugeMarkerFraction(32.4, fat);
  expect(fatPos).toBeGreaterThan(0.85);
  expect(fatPos).toBeLessThan(0.95);

  expect(gaugeMarkerFraction(0.89, whrZones('masculino'))).toBeCloseTo(0.45, 2);

  expect(gaugeMarkerFraction(20, fat)).toBeCloseTo(0.5, 5);
  expect(gaugeMarkerFraction(10, fat)).toBeCloseTo(0.25, 5);

  expect(gaugeMarkerFraction(80, fat)).toBeLessThan(1);
  expect(gaugeMarkerFraction(0, fat)).toBeGreaterThan(0);
  expect(gaugeMarkerFraction(0, fat)).toBeLessThan(0.25);
});

test('novos indicadores: WHR, peso ideal, nível de obesidade e tipo de corpo', () => {
  const { whrZones, idealBodyWeightKg, obesityLevelLabel, bodyTypeLabel } =
    require('../bodyBands') as typeof import('../bodyBands');
  expect(zoneOf(0.89, whrZones('masculino')).label).toBe('Padrão');
  expect(zoneOf(0.96, whrZones('masculino')).label).toBe('Muito alto');
  expect(zoneOf(0.78, whrZones('feminino')).label).toBe('Padrão');
  expect(idealBodyWeightKg(182)).toBeCloseTo(72.9, 1);
  expect(obesityLevelLabel(32.2)).toBe('Obesidade de grau I');
  expect(obesityLevelLabel(22)).toBe('Peso normal');
  expect(bodyTypeLabel('masculino', 182, 32.2, 32.9, 66.7)).toBe('Obesidade');
  expect(bodyTypeLabel('masculino', 182, 23, 15, 66.7)).toBe('Musculoso');
});

test('zonas: IMC segue o CDC, gordura por sexo e visceral por grau', () => {
  expect(zoneOf(32.2, bmiZones()).label).toBe('Obesidade');
  expect(zoneOf(22, bmiZones()).label).toBe('Padrão');
  expect(zoneOf(32.9, fatPctZones('masculino')).label).toBe('Muito alto');
  expect(zoneOf(25, fatPctZones('feminino')).label).toBe('Padrão');
  expect(zoneOf(8, visceralZones()).label).toBe('Padrão');
  expect(zoneOf(15, visceralZones()).label).toBe('Muito alto');
});
