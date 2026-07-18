import { basalMetabolicRate, bmiOf, scoreOf, type BodyReport } from '../bodyReport';
import { reportHtml } from '../reportHtml';

test('IMC e taxa metabólica basal (Mifflin-St Jeor)', () => {
  expect(bmiOf(106.7, 182)).toBe(32.2);
  // 10×106,7 + 6,25×182 − 5×49 + 5 = 1964,5 → 1965
  expect(basalMetabolicRate('masculino', 106.7, 182, 49)).toBe(1965);
  expect(basalMetabolicRate('feminino', 70, 165, 30)).toBe(
    Math.round(10 * 70 + 6.25 * 165 - 150 - 161),
  );
});

test('pontuação desconta indicadores fora da faixa e fica entre 0 e 100', () => {
  const ok = { value: 5, min: 1, max: 10 };
  const alto = { value: 15, min: 1, max: 10 };
  expect(scoreOf({ fatPct: ok, bmi: ok, water: ok, muscle: ok, visceral: 5 })).toBe(100);
  const ruim = scoreOf({ fatPct: alto, bmi: alto, water: alto, muscle: alto, visceral: 15 });
  expect(ruim).toBeLessThan(70);
  expect(ruim).toBeGreaterThanOrEqual(0);
});

test('documento traz nome, pontuação, seções e faixas', () => {
  const r: BodyReport = {
    name: 'Jorge',
    sex: 'masculino',
    age: 49,
    heightCm: 182,
    weightKg: 106.7,
    generatedAt: new Date(2026, 6, 17, 10, 1),
    composition: {
      waterKg: { value: 52.4, min: 39, max: 48.6 },
      proteinKg: { value: 14.3, min: 10.6, max: 13.3 },
      fatKg: { value: 35.1, min: 8.7, max: 17.4 },
      boneKg: { value: 4.8, min: 3.6, max: 4.4 },
      muscleKg: { value: 66.7, min: 49.7, max: 61.9 },
      skeletalKg: { value: 41.1, min: 31.3, max: 38.3 },
    },
    bmi: { value: 32.2, min: 18.5, max: 25 },
    fatPct: { value: 32.9, min: 10, max: 20 },
    weightRange: { value: 106.7, min: 61.3, max: 82.8 },
    weightAdjustKg: -23.9,
    fatAdjustKg: -17.7,
    muscleAdjustKg: 0,
    indicators: {
      visceralFat: 15,
      bmrKcal: 1964,
      fatFreeMassKg: 71.5,
      subcutaneousPct: 23.5,
      smi: 9.7,
      bodyAge: 52,
    },
    history: {
      weight: [
        { dayLabel: '08/07', value: 108 },
        { dayLabel: '16/07', value: 106.7 },
      ],
      muscle: [],
      fatPct: [],
    },
    score: 66,
    suggestions: ['Sugestão de teste.'],
    compositionEstimated: false,
  };
  const html = reportHtml(r);
  expect(html).toContain('Jorge');
  expect(html).toContain('Relatório de análise de composição corporal');
  expect(html).toContain('Água corporal');
  expect(html).toContain('Músculo esquelético');
  expect(html).toContain('Taxa metabólica basal');
  expect(html).toContain('>66<');
  expect(html).toContain('Sugestão de teste.');
  expect(html).toContain('39,0–48,6');
});
