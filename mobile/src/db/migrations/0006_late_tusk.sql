CREATE TABLE `gym_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exercise` text NOT NULL,
	`kind` text NOT NULL,
	`weight_kg` real,
	`sets` integer,
	`reps` integer,
	`minutes` real,
	`kcal` real NOT NULL,
	`logged_at` text NOT NULL
);
