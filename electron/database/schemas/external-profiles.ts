import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const externalProfiles = sqliteTable("external_profiles", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull(),
	username: text("username"),
	avatar: text("avatar"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	type: text("type").$type<"steam">().unique(),
});
