ALTER TABLE `dish_items` ADD `unit` text DEFAULT 'g' NOT NULL;--> statement-breakpoint
ALTER TABLE `food_items` ADD `unit` text DEFAULT 'g' NOT NULL;--> statement-breakpoint
ALTER TABLE `food_logs` ADD `portion_unit` text DEFAULT 'g' NOT NULL;