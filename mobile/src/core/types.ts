export type LogOrigin = 'manual' | 'scan' | 'healthkit' | 'healthconnect';
export type DoseRoute = 'injecao' | 'pilula';

export interface Profile {
  id: number;
  name: string | null;
  heightCm: number | null;
  goalWeightKg: number | null;
  medication: string | null;
  disclaimerAcceptedAt: string | null; // ISO 8601
  waterGoalMl: number;
  calorieGoalKcal: number | null;
  sex: 'feminino' | 'masculino' | 'nao_informar' | null;
}

export interface WaterLog {
  id: number;
  amountMl: number;
  loggedAt: string;
}

export interface FoodLog {
  id: number;
  name: string;
  portionGrams: number | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  origin: LogOrigin;
  photoUri: string | null;
  loggedAt: string;
}

export interface DoseLog {
  id: number;
  medication: string;
  doseMg: number;
  route: DoseRoute;
  injectionSite: string | null;
  loggedAt: string;
  nextDoseAt: string | null;
}

export interface SymptomLog {
  id: number;
  kind: string;
  intensity: number;
  loggedAt: string;
}

export interface WeightLog {
  id: number;
  weightKg: number;
  origin: LogOrigin;
  loggedAt: string;
}

export interface FoodItem {
  id: number;
  name: string;
  category: string | null;
  referencePortion: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  source: 'taco' | 'internacional';
}
