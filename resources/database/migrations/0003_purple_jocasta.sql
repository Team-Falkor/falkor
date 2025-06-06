CREATE TABLE `external_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`username` text,
	`avatar` text,
	`access_token` text,
	`refresh_token` text,
	`type` text,
	CONSTRAINT "external_profiles_type_check" CHECK("external_profiles"."type" IN ('steam'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_profiles_type_unique` ON `external_profiles` (`type`);