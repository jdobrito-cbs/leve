CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place` text NOT NULL,
	`specialty` text NOT NULL,
	`doctor` text,
	`scheduled_at` text NOT NULL
);
