import fs from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { constants } from "../utils/constants";

import * as schema from "./schemas";

const dbPath = constants.databasePath;

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, {
	schema,
});

const migrationsFolder = constants.migrationPath;

const doMigration = () => migrate(db, { migrationsFolder });

try {
	doMigration();
} catch (error) {
	console.log(error);
	// if failed to migrate, rename the database to database.bak
	const newDbPath = path.join(dbPath, "database.bak");
	fs.rename(dbPath, newDbPath)
		.catch((err) => {
			console.log(err);
			throw new Error("Failed to migrate database");
		})
		.then(() => {
			doMigration();
		});
}
