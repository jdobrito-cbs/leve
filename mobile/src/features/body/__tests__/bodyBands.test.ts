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

test('geometria dos medidores é a da balança: zonas iguais e marcador interno', () => {
  const fat = fatPctZones('masculino'); // fronteiras 10/20/25, 4 zonas iguais
  expect(gaugeBoundaryFractions(fat)).toEqual([0.25, 0.5, 0.75]);

  // Balança: gordura 32,4% cai DENTRO de "Muito alto" (~90%), nunca em 100%.
  const fatPos = gaugeMarkerFraction(32.4, fat);
  expect(fatPos).toBeGreaterThan(0.85);
  expect(fatPos).toBeLessThan(0.95);

  // Balança (WHR 0,89 masc): 80% dentro da zona Padrão → 45% da régua.
  expect(gaugeMarkerFraction(0.89, whrZones('masculino'))).toBeCloseTo(0.45, 2);

  // Continuidade: valor exatamente na fronteira fica na divisa.
  expect(gaugeMarkerFraction(20, fat)).toBeCloseTo(0.5, 5);
  expect(gaugeMarkerFraction(10, fat)).toBeCloseTo(0.25, 5);

  // Excesso gigante se aproxima da borda sem tocar; valor mínimo idem à esquerda.
  expect(gaugeMarkerFraction(80, fat)).toBeLessThan(1);
  expect(gaugeMarkerFraction(0, fat)).toBeGreaterThan(0);
  expect(gaugeMarkerFraction(0, fat)).toBeLessThan(0.25);
});

test('novos indicadores: WHR, peso ideal, nível de obesidade e tipo de corpo', () => {
  const { whrZones, idealBodyWeightKg, obesityLevelLabel, bodyTypeLabel } =
    require('../bodyBands') as typeof import('../bodyBands');
  // Balança do dono: 0,89 masculino = Padrão (fronteiras 0,85/0,90/0,95).
  expect(zoneOf(0.89, whrZones('masculino')).label).toBe('Padrão');
  expect(zoneOf(0.96, whrZones('masculino')).label).toBe('Muito alto');
  expect(zoneOf(0.78, whrZones('feminino')).label).toBe('Padrão');
  // Balança do dono: 72,9 kg para 1,82 m (IMC 22).
  expect(idealBodyWeightKg(182)).toBeCloseTo(72.9, 1);
  expect(obesityLevelLabel(32.2)).toBe('Obesidade de grau I');
  expect(obesityLevelLabel(22)).toBe('Peso normal');
  // Dono: gordura 32,9% + IMC 32,2 → tipo "Obesidade".
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
