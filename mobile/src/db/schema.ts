import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  heightCm: real('height_cm'),
  goalWeightKg: real('goal_weight_kg'),
  medication: text('medication'),
  disclaimerAcceptedAt: text('disclaimer_accepted_at'),
  waterGoalMl: real('water_goal_ml').notNull().default(2000),
  calorieGoalKcal: real('calorie_goal_kcal'),
  sex: text('sex'), // 'feminino' | 'masculino' | 'nao_informar'
  birthDate: text('birth_date'), // 'YYYY-MM-DD'
});

export const waterLogs = sqliteTable('water_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amountMl: real('amount_ml').notNull(),
  loggedAt: text('logged_at').notNull(),
});

export const foodLogs = sqliteTable('food_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  portionGrams: real('portion_grams'),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fiberG: real('fiber_g'),
  origin: text('origin').notNull().default('manual'),
  photoUri: text('photo_uri'),
  period: text('period'), // 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia'
  loggedAt: text('logged_at').notNull(),
});

// Pratos salvos para reutilizar (modelos de refeição).
export const dishes = sqliteTable('dishes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const dishItems = sqliteTable('dish_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dishId: integer('dish_id').notNull(),
  name: text('name').notNull(),
  grams: real('grams'),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fiberG: real('fiber_g'),
});

export const doseLogs = sqliteTable('dose_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  medication: text('medication').notNull(),
  doseMg: real('dose_mg').notNull(),
  route: text('route').notNull(),
  injectionSite: text('injection_site'),
  loggedAt: text('logged_at').notNull(),
  nextDoseAt: text('next_dose_at'),
});

export const symptomLogs = sqliteTable('symptom_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(),
  intensity: integer('intensity').notNull(),
  loggedAt: text('logged_at').notNull(),
});

export const weightLogs = sqliteTable('weight_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weightKg: real('weight_kg').notNull(),
  origin: text('origin').notNull().default('manual'),
  loggedAt: text('logged_at').notNull(),
});

export const foodItems = sqliteTable('food_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  nameNormalized: text('name_normalized'),
  category: text('category'),
  referencePortion: text('reference_portion'),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fiberG: real('fiber_g'),
  source: text('source').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const healthMetrics = sqliteTable('health_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  value: real('value').notNull(),
  unit: text('unit').notNull(),
  origin: text('origin').notNull().default('manual'),
  loggedAt: text('logged_at').notNull(),
});

export const periodLogs = sqliteTable('period_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  flow: text('flow'),
});

export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  doseText: text('dose_text'),
  times: text('times').notNull(), // 'HH:MM,HH:MM'
  active: integer('active').notNull().default(1),
});

// Exercícios de academia (força e cardio) com estimativa de calorias.
export const gymLogs = sqliteTable('gym_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exercise: text('exercise').notNull(), // chave do catálogo
  kind: text('kind').notNull(), // 'forca' | 'cardio'
  weightKg: real('weight_kg'),
  sets: integer('sets'),
  reps: integer('reps'),
  minutes: real('minutes'),
  kcal: real('kcal').notNull(),
  loggedAt: text('logged_at').notNull(),
});

export const medIntakes = sqliteTable('med_intakes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  medicationId: integer('medication_id').notNull(),
  scheduledFor: text('scheduled_for').notNull(), // 'YYYY-MM-DD HH:MM'
  takenAt: text('taken_at'),
});
