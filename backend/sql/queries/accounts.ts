import {
  ExternalAccount,
  ExternalNewAccountInput,
  ExternalRefreshTokenFunction,
  ExternalTokenUpdateInput,
} from "@/@types/accounts";
import logger from "../../handlers/logging";
import { db } from "../knex";
import { BaseQuery } from "./base";

/**
 * Handles CRUD operations for accounts in the database
 */
class AccountsDB extends BaseQuery {
  initialized = false;

  /**
   * Initializes the database tables if they don't exist
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const success = await this.ensureTable("accounts", (table) => {
      table.increments("id").primary().notNullable();
      table.string("username");
      table.string("email");
      table.string("avatar");
      table.string("client_id");
      table.string("client_secret");
      table.string("access_token").notNullable();
      table.string("refresh_token").notNullable();
      table.integer("expires_in").notNullable();
      table.string("type").unique().notNullable();
    });
    
    if (!success) {
      throw new Error("Failed to initialize accounts table");
    }
    
    this.initialized = true;
  }

  /**
   * Adds a new account to the database
   * @param input The new account data
   */
  async addAccount(input: ExternalNewAccountInput): Promise<boolean> {
    await this.init();

    if (!input.access_token || !input.refresh_token) {
      logger.log("error", "Access token and refresh token are required");
      throw new Error("Access token and refresh token are required");
    }

    return await this.executeTransaction(async (trx) => {
      await trx("accounts").insert({
        username: input.username,
        email: input.email,
        avatar: input.avatar,
        client_id: input.client_id,
        client_secret: input.client_secret,
        access_token: input.access_token,
        refresh_token: input.refresh_token,
        expires_in: input.expires_in,
        type: input.type,
      });
      return true;
    }, "Error adding account") ?? false;
  }

  /**
   * Retrieves an account from the database by email, username, or type
   * @param identifier The email, username, or type of the account to fetch
   * @param type The type of account to fetch, if specified
   */
  async getAccount(
    identifier: string,
    type?: string
  ): Promise<ExternalAccount | null> {
    await this.init();

    return await this.executeOperation(async () => {
      const query = db("accounts").where((builder) => {
        builder.where("email", identifier).orWhere("username", identifier);
      });

      if (type) {
        query.andWhere("type", type);
      }

      const result = await query.first();
      return result || null;
    }, "Error fetching account");
  }
  

  async getAccounts(type?: string): Promise<ExternalAccount[]> {
    await this.init();

    return await this.executeOperation(async () => {
      const query = db("accounts");

      if (type) {
        query.andWhere("type", type);
      }

      return await query.select("*");
    }, "Error fetching accounts");
  }

  /**
   * Updates the tokens and expiration for an account
   * @param identifier The email, username, or type of the account to update
   * @param input The updated account data
   * @param type The type of account to update, if specified
   */
  async updateTokens(
    identifier: string,
    input: ExternalTokenUpdateInput,
    type?: string
  ): Promise<boolean> {
    await this.init();

    return await this.executeTransaction(async (trx) => {
      const query = trx("accounts").where((builder) => {
        builder.where("email", identifier).orWhere("username", identifier);
      });

      if (type) {
        query.andWhere("type", type);
      }

      const result = await query.update({
        access_token: input.access_token,
        refresh_token: input.refresh_token,
        expires_in: input.expires_in,
      });
      
      return result > 0;
    }, "Error updating tokens") ?? false;
  }

  /**
   * Deletes an account from the database by email, username, or type
   * @param identifier The email, username, or type of the account to delete
   * @param type The type of account to delete, if specified
   */
  async deleteAccount(identifier: string, type?: string): Promise<boolean> {
    await this.init();

    return await this.executeOperation(async () => {
      const query = db("accounts").where((builder) => {
        builder.where("email", identifier).orWhere("username", identifier);
      });

      if (type) {
        query.andWhere("type", type);
      }

      await query.del();
      return true;
    }, "Error deleting account");
  }

  /**
   * Refreshes the tokens for an account if the tokens have expired
   * @param identifier The email, username, or type of the account to refresh
   * @param refreshTokenFunction The function to use to refresh the tokens
   * @param type The type of account to refresh, if specified
   */
  async refreshAccountTokens(
    identifier: string,
    refreshTokenFunction: ExternalRefreshTokenFunction,
    type?: string
  ): Promise<boolean> {
    await this.init();

    const account = await this.getAccount(identifier, type);
    if (!account) {
      logger.log("error", "Account not found for token refresh");
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(account.expires_in);

    if (expiresAt <= now) {
      return await this.executeOperation(async () => {
        const {
          accessToken,
          refreshToken,
          expiresIn: newExpiry,
        } = await refreshTokenFunction(account.refresh_token);

        await this.updateTokens(
          identifier,
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: new Date(newExpiry),
          },
          type
        );
        return true;
      }, "Error refreshing tokens");
    }
    
    return true;
  }
}

const accountsDB = new AccountsDB();

export { accountsDB };
