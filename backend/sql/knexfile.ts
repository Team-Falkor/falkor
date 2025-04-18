import { app } from "electron";
import { constants } from "../utils";
import { Knex } from "knex";
import { Database } from "better-sqlite3";

const config: {
    development: Knex.Config,
    production: Knex.Config
} = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: constants.databasePath,
    },
    useNullAsDefault: true,
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn: Database, done: () => void) => {
        // Enable foreign keys support
        conn.pragma('foreign_keys', {
            simple: true,
        });
        done();
      },
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    debug: Boolean(process.env?.debug) ?? !app.isPackaged,
  },
  production: {
    client: "better-sqlite3",
    connection: {
      filename: constants.databasePath,
    },
    useNullAsDefault: true,
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn: Database, done: () => void) => {
        conn.pragma('foreign_keys', {
            simple: true,
        });
        done();
      },
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    debug: false,
  },
};

export default config;