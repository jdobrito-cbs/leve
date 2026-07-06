import { strings } from '../pt-BR';

test('disclaimer médico canônico presente', () => {
  expect(strings.disclaimer.medical).toContain('não substitui orientação médica');
  expect(strings.disclaimer.medical).toContain('Decisões sobre dose e tratamento são do seu médico');
});

test('sem promessas de perda de peso', () => {
  const all = JSON.stringify(strings).toLowerCase();
  expect(all).not.toMatch(/emagre[cç]|perder peso garantido|resultado garantido/);
});
