export const PREMIUM_LOCKS = {
  scanFood: true,
  healthSync: true,
  meds: true,
  gym: true,
  cycle: true,
  bodyReport: true,
  appointments: true,
  insights: false,
  savedDishes: false,
} as const;

export type LockableFeature = keyof typeof PREMIUM_LOCKS;

export function isLocked(feature: LockableFeature, premium: boolean): boolean {
  return PREMIUM_LOCKS[feature] && !premium;
}
