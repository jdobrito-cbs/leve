import { distanceLabel, durationLabel, paceLabel, workoutTypeLabel } from '../format';
import { strings } from '@/i18n/pt-BR';

test('duração formatada (mm:ss e h:mm:ss)', () => {
  expect(durationLabel(1800)).toBe('30:00');
  expect(durationLabel(3661)).toBe('1:01:01');
  expect(durationLabel(null)).toBe('—');
  expect(durationLabel(0)).toBe('—');
});

test('distância e ritmo no métrico padrão', () => {
  expect(distanceLabel(5000)).toContain('km');
  expect(distanceLabel(null)).toBe('—');
  expect(paceLabel(5000, 1500)).toBe('5:00 /km');
  expect(paceLabel(null, 1500)).toBe('—');
});

test('rótulo de tipo de treino', () => {
  expect(workoutTypeLabel('run')).toBe(strings.workouts.run);
  expect(workoutTypeLabel('walk')).toBe(strings.workouts.walk);
  expect(workoutTypeLabel('x')).toBe(strings.workouts.other);
});
