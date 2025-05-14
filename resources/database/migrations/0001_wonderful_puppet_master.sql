PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_library_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_name` text NOT NULL,
	`game_path` text,
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
INSERT INTO `__new_library_games`("id", "game_name", "game_path", "game_id", "game_steam_id", "game_icon", "game_args", "game_command", "wine_prefix_folder", "game_playtime", "game_last_played", "igdb_id") SELECT "id", "game_name", "game_path", "game_id", "game_steam_id", "game_icon", "game_args", "game_command", "wine_prefix_folder", "game_playtime", "game_last_played", "igdb_id" FROM `library_games`;--> statement-breakpoint
DROP TABLE `library_games`;--> statement-breakpoint
ALTER TABLE `__new_library_games` RENAME TO `library_games`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `library_games_game_name_unique` ON `library_games` (`game_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `library_games_game_path_unique` ON `library_games` (`game_path`);--> statement-breakpoint
CREATE UNIQUE INDEX `library_games_game_id_unique` ON `library_games` (`game_id`);