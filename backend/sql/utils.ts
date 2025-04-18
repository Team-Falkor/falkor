import { db } from './knex';
import logger  from '../handlers/logging';
import { Knex } from 'knex';

/**
 * Database utility functions for common operations and error handling
 */
export const dbUtils = {
  /**
   * Execute a database operation with proper error handling
   * @param operation Function that performs database operations
   * @param errorMessage Custom error message prefix
   * @returns Result of the operation or null on error
   */
  async executeOperation<T>(operation: () => Promise<T>, errorMessage: string): Promise<T  | null> {
    try {
      return await operation();
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      logger.log('error', `${errorMessage}: ${error}`);
      return  null
    }
  },

  /**
   * Execute a database operation within a transaction
   * @param operation Function that performs database operations using the transaction
   * @param errorMessage Custom error message prefix
   * @returns Result of the operation or null on error
   */
  async executeTransaction<T>(operation: (trx: Knex.Transaction) => Promise<T>, errorMessage: string): Promise<T | null> {
    try {
      return await db.transaction(async (trx) => {
        return await operation(trx);
      });
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      logger.log('error', `${errorMessage}: ${error}`);
      return null;
    }
  },

  /**
   * Check if a table exists and create it if it doesn't
   * @param tableName Name of the table to check/create
   * @param createTable Function that defines the table schema
   * @returns True if successful, false otherwise
   */
  async ensureTable(tableName: string, createTable: (schema: Knex.SchemaBuilder) => Promise<void>): Promise<boolean | null> {
    return await this.executeOperation(async () => {
      const exists = await db.schema.hasTable(tableName);
      if (!exists) {
        await createTable(db.schema);
      }
      return true;
    }, `Error ensuring table ${tableName} exists`);
  }
};