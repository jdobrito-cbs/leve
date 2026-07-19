export type LogOrigin = 'manual' | 'scan' | 'healthkit' | 'healthconnect';
export type DoseRoute = 'injecao' | 'pilula';
export type MealPeriod = 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia';

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
  birthDate: string | null; // 'YYYY-MM-DD'
}

export interface WaterLog {
  id: number;
  amountMl: number;
  loggedAt: string;
}

/** Unidade da porção: sólidos em gramas, líquidos em mililitros. */
export type PortionUnit = 'g' | 'ml';

export interface FoodLog {
  id: number;
  name: string;
  portionGrams: number | null;
  portionUnit: PortionUnit;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  origin: LogOrigin;
  photoUri: string | null;
  period: MealPeriod | null;
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
  unit: PortionUnit;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  source: 'taco' | 'regional' | 'internacional';
}
