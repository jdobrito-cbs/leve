CREATE TABLE `dose_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medication` text NOT NULL,
	`dose_mg` real NOT NULL,
	`route` text NOT NULL,
	`injection_site` text,
	`logged_at` text NOT NULL,
	`next_dose_at` text
);
--> statement-breakpoint
CREATE TABLE `food_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`reference_portion` text,
	`calories` real,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `food_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`portion_grams` real,
	`calories` real,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`origin` text DEFAULT 'manual' NOT NULL,
	`photo_uri` text,
	`logged_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`height_cm` real,
	`goal_weight_kg` real,
	`medication` text,
	`disclaimer_accepted_at` text
);
--> statement-breakpoint
CREATE TABLE `symptom_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`intensity` integer NOT NULL,
	`logged_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `water_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount_ml` real NOT NULL,
	`logged_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weight_kg` real NOT NULL,
	`origin` text DEFAULT 'manual' NOT NULL,
	`logged_at` text NOT NULL
);
