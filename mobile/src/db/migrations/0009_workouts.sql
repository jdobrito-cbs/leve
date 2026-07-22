CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`external_id` text,
	`type` text DEFAULT 'other' NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text,
	`duration_sec` integer,
	`distance_m` real,
	`calories` real,
	`route_json` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workouts_source_ext` ON `workouts` (`source`,`external_id`);
