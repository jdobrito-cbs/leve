import {
  bmiZones,
  componentBandKg,
  fatPctZones,
  idealWeightBounds,
  visceralZones,
  zoneOf,
} from '../bodyBands';

// Referência: medidas reais da balança do dono (masculino, 1,82 m).
test('faixas masculinas reproduzem os medidores da balança (1,82 m)', () => {
  const ideal = idealWeightBounds(182);
  expect(ideal.min).toBeCloseTo(61.3, 1);
  expect(ideal.max).toBeCloseTo(82.8, 1);

  const muscle = componentBandKg('masculino', 182, 'muscle');
  expect(muscle.min).toBeCloseTo(49.2, 1); // balança: 49,7
  expect(muscle.max).toBeCloseTo(61.2, 1); // balança: 61,9

  const protein = componentBandKg('masculino', 182, 'protein');
  expect(protein.min).toBeCloseTo(10.5, 1); // balança: 10,6
  expect(protein.max).toBeCloseTo(13.2, 1); // balança: 13,3

  const water = componentBandKg('masculino', 182, 'water');
  expect(water.min).toBeCloseTo(38.6, 1); // balança: 39,0
  expect(water.max).toBeCloseTo(48.0, 1); // balança: 48,6
});

test('zonas: IMC segue o CDC, gordura por sexo e visceral por grau', () => {
  expect(zoneOf(32.2, bmiZones()).label).toBe('Obesidade');
  expect(zoneOf(22, bmiZones()).label).toBe('Padrão');
  expect(zoneOf(32.9, fatPctZones('masculino')).label).toBe('Muito alto');
  expect(zoneOf(25, fatPctZones('feminino')).label).toBe('Padrão');
  expect(zoneOf(8, visceralZones()).label).toBe('Padrão');
  expect(zoneOf(15, visceralZones()).label).toBe('Muito alto');
});
