PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_external_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`username` text,
	`avatar` text,
	`access_token` text,
	`refresh_token` text,
	`type` text
);
--> statement-breakpoint
INSERT INTO `__new_external_profiles`("id", "user_id", "username", "avatar", "access_token", "refresh_token", "type") SELECT "id", "user_id", "username", "avatar", "access_token", "refresh_token", "type" FROM `external_profiles`;--> statement-breakpoint
DROP TABLE `external_profiles`;--> statement-breakpoint
ALTER TABLE `__new_external_profiles` RENAME TO `external_profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `external_profiles_type_unique` ON `external_profiles` (`type`);