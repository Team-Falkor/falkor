ALTER TABLE `library_games` ADD `use_proton` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `library_games` ADD `proton_variant` text;--> statement-breakpoint
ALTER TABLE `library_games` ADD `proton_version` text;