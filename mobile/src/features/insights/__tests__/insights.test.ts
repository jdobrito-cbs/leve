import { buildInsights, type InsightInput } from '../insights';

const empty: InsightInput = {
  weights28: [],
  bodyFat28: [],
  muscle28: [],
  bodyWater28: [],
  sleep7: [],
  restingHr7: [],
  restingHr30: [],
  waterPctOfGoal7: [],
};

const pts = (...values: number[]) => values.map((value) => ({ value }));

test('sem dados → sem observações', () => {
  expect(buildInsights(empty)).toEqual([]);
});

test('peso subiu com gordura caindo e músculo subindo → positivo', () => {
  const out = buildInsights({
    ...empty,
    weights28: pts(92, 92.2, 92.8, 93.1),
    bodyFat28: pts(32, 31.8, 31.2, 31.0),
    muscle28: pts(28, 28.1, 28.5, 28.7),
  });
  expect(out).toHaveLength(1);
  expect(out[0].kind).toBe('positivo');
  expect(out[0].id).toBe('recomp-positiva');
});

test('peso subiu com gordura subindo e músculo caindo → atenção', () => {
  const out = buildInsights({
    ...empty,
    weights28: pts(92, 92.2, 92.9, 93.4),
    bodyFat28: pts(31, 31.2, 31.8, 32.1),
    muscle28: pts(28.5, 28.4, 28.0, 27.9),
  });
  expect(out[0].kind).toBe('atencao');
  expect(out[0].text).toMatch(/médico/);
});

test('sono baixo, FC de repouso alta e hidratação baixa → atenções', () => {
  const out = buildInsights({
    ...empty,
    sleep7: [5.5, 5.0, 6.2, 5.8],
    restingHr7: [78, 80, 79],
    restingHr30: [68, 70, 69, 71, 70],
    waterPctOfGoal7: [0.4, 0.5, 0.3, 0.55, 0.5, 0.9],
  });
  const ids = out.map((i) => i.id);
  expect(ids).toContain('sono-baixo');
  expect(ids).toContain('fc-repouso-alta');
  expect(ids).toContain('hidratacao-baixa');
});
