import { homedir } from "node:os";
import { join } from "node:path";
import type { Config } from "drizzle-kit";

const appDataPath = join(homedir(), "moe.falkor");
const databasePath = join(appDataPath, "database.sqlite");

export default {
	schema: "./electron/database/schemas",
	out: "./resources/database/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: databasePath,
	},
} satisfies Config;
