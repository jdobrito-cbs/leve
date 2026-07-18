/** Métricas de saúde suportadas. `platform: true` = pode vir do HealthKit/Health Connect. */
export const METRIC_DEFS = {
  sleep_hours: { unit: 'h', platform: true },
  /** Eficiência: % do tempo na cama efetivamente dormindo. */
  sleep_efficiency_pct: { unit: '%', platform: true },
  /** Distúrbios respiratórios do sono (apneia) por hora — Apple Watch (iOS 18+). */
  breathing_disturbances: { unit: '/h', platform: true },
  heart_rate_resting: { unit: 'bpm', platform: true },
  heart_rate_avg: { unit: 'bpm', platform: true },
  spo2: { unit: '%', platform: true },
  respiratory_rate: { unit: 'rpm', platform: true },
  active_calories: { unit: 'kcal', platform: true },
  exercise_minutes: { unit: 'min', platform: true },
  body_fat_pct: { unit: '%', platform: true },
  body_water_kg: { unit: 'kg', platform: true },
  lean_mass_kg: { unit: 'kg', platform: true },
  bone_mass_kg: { unit: 'kg', platform: true },
  skeletal_muscle_kg: { unit: 'kg', platform: false },
  muscle_mass_kg: { unit: 'kg', platform: false },
  visceral_fat: { unit: '', platform: false },
  subcutaneous_fat_pct: { unit: '%', platform: false },
  protein_pct: { unit: '%', platform: false },
  metabolic_age: { unit: 'anos', platform: false },
  waist_cm: { unit: 'cm', platform: true },
  hip_cm: { unit: 'cm', platform: false },
} as const;

export type MetricType = keyof typeof METRIC_DEFS;

export const MANUAL_BODY_METRICS: MetricType[] = [
  'body_fat_pct',
  'body_water_kg',
  'skeletal_muscle_kg',
  'muscle_mass_kg',
  'lean_mass_kg',
  'bone_mass_kg',
  'visceral_fat',
  'subcutaneous_fat_pct',
  'protein_pct',
  'metabolic_age',
  'waist_cm',
  'hip_cm',
];

export interface MetricSample {
  type: MetricType;
  value: number;
  takenAt: Date;
}
