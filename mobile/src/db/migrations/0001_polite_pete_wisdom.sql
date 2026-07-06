CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `food_items` ADD `name_normalized` text;--> statement-breakpoint
ALTER TABLE `food_items` ADD `category` text;--> statement-breakpoint
ALTER TABLE `profile` ADD `water_goal_ml` real DEFAULT 2000 NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `calorie_goal_kcal` real;