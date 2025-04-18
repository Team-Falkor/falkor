import { app } from "electron";
import knexClass from "knex";
import config from "./knexfile";

// Determine environment based on app packaging status
const environment = app.isPackaged ? "production" : "development";

// Create database connection with proper configuration from knexfile
export const db = knexClass(config[environment]);

// Add event listeners for connection issues
db.on("error", (error) => {
  console.error("Database connection error:", error);
});

// Initialize database connection
db.raw("SELECT 1").then(() => {
  console.log(`Database connected in ${environment} mode`);
}).catch((error) => {
  console.error("Failed to connect to database:", error);
});
