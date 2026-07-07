CREATE TABLE `dish_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dish_id` integer NOT NULL,
	`name` text NOT NULL,
	`grams` real,
	`calories` real,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`fiber_g` real
);
--> statement-breakpoint
CREATE TABLE `dishes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `food_logs` ADD `period` text;