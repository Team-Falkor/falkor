import { sql } from "drizzle-orm";
import {
	check,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable(
	"accounts",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		username: text("username"),
		email: text("email"),
		avatar: text("avatar"),
		clientId: text("client_id"),
		clientSecret: text("client_secret"),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		expiresIn: integer("expires_in"),
		type: text("type").$type<"real-debrid" | "torbox">().unique(),
	},
	(table) => [
		// Unique constraint on "type"
		uniqueIndex("accounts_type_unique").on(table.type),
		// Enum check constraint for "type" using raw SQL
		check(
			"accounts_type_check",
			sql`${table.type} IN ('real-debrid', 'torbox')`,
		),
	],
);
