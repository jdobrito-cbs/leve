/**
 * Recursos que exigem o Leve Premium. Para mudar o pacote,
 * basta ligar/desligar aqui — as telas consultam este mapa.
 */
export const PREMIUM_LOCKS = {
  scanFood: true, // escanear comida por foto
  healthSync: true, // saúde conectada (relógio/balança)
  meds: true, // controle de medicamentos (Meus remédios)
  gym: true, // academia
  cycle: true, // controle de ciclo menstrual
  bodyReport: true, // relatório corporal em PDF
  appointments: true, // consultas médicas com lembretes
  insights: false,
  savedDishes: false,
} as const;

export type LockableFeature = keyof typeof PREMIUM_LOCKS;

export function isLocked(feature: LockableFeature, premium: boolean): boolean {
  return PREMIUM_LOCKS[feature] && !premium;
}
