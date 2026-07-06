import { INJECTION_SITES, suggestNextSite } from '../rotation';

test('rodízio cicla os 6 locais e começa no primeiro', () => {
  expect(suggestNextSite(null)).toBe('abdomen_e');
  expect(suggestNextSite('abdomen_e')).toBe('abdomen_d');
  expect(suggestNextSite('braco_d')).toBe('abdomen_e');
  expect(INJECTION_SITES).toHaveLength(6);
});
