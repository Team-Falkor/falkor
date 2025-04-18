import { db } from '../knex';
import { dbUtils } from '../utils';
import logger from '../../handlers/logging';
import { Knex } from 'knex';

/**
 * Base class for all database query classes
 * Provides common functionality and error handling
 */
export abstract class BaseQuery {
  protected initialized: boolean = false;

  /**
   * Initialize the database tables required by this query class
   * Must be implemented by subclasses
   */
  abstract init(): Promise<void>;

  /**
   * Execute a database operation with proper error handling
   * @param operation Function that performs database operations
   * @param errorMessage Custom error message prefix
   * @returns Result of the operation or null on error
   */
  protected async executeOperation<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
    const result = await dbUtils.executeOperation(operation, errorMessage);
    if (result === null) {
      throw new Error(errorMessage);
    }
    return result;
  }

  /**
   * Execute a database operation within a transaction
   * @param operation Function that performs database operations using the transaction
   * @param errorMessage Custom error message prefix
   * @returns Result of the operation
   */
  protected async executeTransaction<T>(operation: (trx: Knex.Transaction) => Promise<T>, errorMessage: string): Promise<T> {
    const result = await dbUtils.executeTransaction(operation, errorMessage);
    if (result === null) {
      throw new Error(errorMessage);
    }
    return result;
  }

  /**
   * Check if a table exists and create it if it doesn't
   * @param tableName Name of the table to check/create
   * @param createTable Function that defines the table schema
   * @returns True if successful, false otherwise
   */
  protected async ensureTable(tableName: string, createTable: (table: Knex.CreateTableBuilder) => void): Promise<boolean> {
    return await this.executeOperation(async () => {
      const exists = await db.schema.hasTable(tableName);
      if (!exists) {
        await db.schema.createTable(tableName, (table) => {
          createTable(table);
        });
        logger.log('info', `Created table ${tableName}`);
      }
      return true;
    }, `Error ensuring table ${tableName} exists`);
  }
}
