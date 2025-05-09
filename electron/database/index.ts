import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { constants } from "../utils/constants";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schemas";

const dbPath = constants.databasePath;

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, {
	schema,
});

const migrationsFolder = constants.migrationPath;

migrate(db, { migrationsFolder });
