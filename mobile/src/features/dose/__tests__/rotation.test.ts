import { INJECTION_SITES, suggestNextSite } from '../rotation';

test('rodízio cicla os 10 locais (6 pontos de abdômen) e começa no primeiro', () => {
  expect(INJECTION_SITES).toHaveLength(10);
  expect(INJECTION_SITES.filter((s) => s.startsWith('abdomen')).length).toBe(6);
  expect(suggestNextSite(null)).toBe('abdomen_sup_e');
  expect(suggestNextSite('abdomen_sup_e')).toBe('abdomen_sup_d');
  expect(suggestNextSite('abdomen_inf_d')).toBe('coxa_e');
  expect(suggestNextSite('braco_d')).toBe('abdomen_sup_e');
});
