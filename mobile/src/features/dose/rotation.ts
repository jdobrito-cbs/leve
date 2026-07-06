export const INJECTION_SITES = [
  'abdomen_e',
  'abdomen_d',
  'coxa_e',
  'coxa_d',
  'braco_e',
  'braco_d',
] as const;

export type InjectionSite = (typeof INJECTION_SITES)[number];

/** Sugestão de rodízio — apoio de memória; a escolha final é do usuário/médico. */
export function suggestNextSite(last: InjectionSite | null): InjectionSite {
  if (!last) return INJECTION_SITES[0];
  const i = INJECTION_SITES.indexOf(last);
  return INJECTION_SITES[(i + 1) % INJECTION_SITES.length];
}
