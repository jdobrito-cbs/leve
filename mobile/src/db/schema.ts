import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  heightCm: real('height_cm'),
  goalWeightKg: real('goal_weight_kg'),
  medication: text('medication'),
  disclaimerAcceptedAt: text('disclaimer_accepted_at'),
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
  origin: text('origin').notNull().default('manual'),
  photoUri: text('photo_uri'),
  loggedAt: text('logged_at').notNull(),
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
  referencePortion: text('reference_portion'),
  calories: real('calories'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  source: text('source').notNull(),
});
