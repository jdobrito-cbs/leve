export const INJECTION_SITES = [
  'abdomen_sup_e',
  'abdomen_sup_d',
  'abdomen_meio_e',
  'abdomen_meio_d',
  'abdomen_inf_e',
  'abdomen_inf_d',
  'coxa_e',
  'coxa_d',
  'braco_e',
  'braco_d',
] as const;

export type InjectionSite = (typeof INJECTION_SITES)[number];

export function suggestNextSite(last: InjectionSite | null): InjectionSite {
  if (!last) return INJECTION_SITES[0];
  const i = INJECTION_SITES.indexOf(last);
  return INJECTION_SITES[(i + 1) % INJECTION_SITES.length];
}
