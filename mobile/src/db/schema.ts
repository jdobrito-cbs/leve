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
  sex: text('sex'),
  birthDate: text('birth_date'),
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
  portionUnit: text('portion_unit').notNull().default('g'),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fiberG: real('fiber_g'),
  origin: text('origin').notNull().default('manual'),
  photoUri: text('photo_uri'),
  period: text('period'),
  loggedAt: text('logged_at').notNull(),
});

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
  unit: text('unit').notNull().default('g'),
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
  unit: text('unit').notNull().default('g'),
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
  times: text('times').notNull(),
  active: integer('active').notNull().default(1),
});

export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  place: text('place').notNull(),
  specialty: text('specialty').notNull(),
  doctor: text('doctor'),
  scheduledAt: text('scheduled_at').notNull(),
});

export const gymLogs = sqliteTable('gym_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exercise: text('exercise').notNull(),
  kind: text('kind').notNull(),
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
  scheduledFor: text('scheduled_for').notNull(),
  takenAt: text('taken_at'),
});

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(),
  externalId: text('external_id'),
  type: text('type').notNull().default('other'),
  startAt: text('start_at').notNull(),
  endAt: text('end_at'),
  durationSec: integer('duration_sec'),
  distanceM: real('distance_m'),
  calories: real('calories'),
  avgHr: real('avg_hr'),
  routeJson: text('route_json'),
  createdAt: text('created_at').notNull(),
});
