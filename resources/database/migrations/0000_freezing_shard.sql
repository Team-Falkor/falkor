CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text,
	`email` text,
	`avatar` text,
	`client_id` text,
	`client_secret` text,
	`access_token` text,
	`refresh_token` text,
	`expires_in` integer,
	`type` text,
	CONSTRAINT "accounts_type_check" CHECK("accounts"."type" IN ('real-debrid', 'torbox'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_type_unique` ON `accounts` (`type`);--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` text NOT NULL,
	`achievement_display_name` text NOT NULL,
	`achievement_name` text NOT NULL,
	`description` text,
	`unlocked` integer DEFAULT false NOT NULL,
	`unlockedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `library_games`(`game_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_achievement_name` ON `achievements` (`game_id`,`achievement_name`);--> statement-breakpoint
CREATE TABLE `library_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_name` text NOT NULL,
	`game_path` text NOT NULL,
	`game_id` text NOT NULL,
	`game_steam_id` text,
	`game_icon` text,
	`game_args` text,
	`game_command` text,
	`wine_prefix_folder` text,
	`game_playtime` integer DEFAULT 0 NOT NULL,
	`game_last_played` integer,
	`igdb_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_games_game_name_unique` ON `library_games` (`game_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `library_games_game_path_unique` ON `library_games` (`game_path`);--> statement-breakpoint
CREATE UNIQUE INDEX `library_games_game_id_unique` ON `library_games` (`game_id`);--> statement-breakpoint
CREATE TABLE `lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lists_name_unique` ON `lists` (`name`);--> statement-breakpoint
CREATE TABLE `lists_library_games` (
	`list_id` integer NOT NULL,
	`game_id` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game_id`) REFERENCES `library_games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lists_library_games_unique` ON `lists_library_games` (`list_id`,`game_id`);