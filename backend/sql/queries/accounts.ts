import {
  ExternalAccount,
  ExternalNewAccountInput,
  ExternalRefreshTokenFunction,
  ExternalTokenUpdateInput,
} from "@/@types/accounts";
import { logger } from "../../handlers/logging";
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

    try {
      const exists = await db.schema.hasTable("accounts");
      if (!exists) {
        await db.schema.createTable("accounts", (table) => {
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
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing database accounts:", error);
      logger.log("error", `Error initializing database accounts: ${error}`);
    }
  }

  /**
   * Adds a new account to the database
   * @param input The new account data
   */
  async addAccount(input: ExternalNewAccountInput): Promise<void> {
    await this.init();

    if (!input.access_token || !input.refresh_token) {
      throw new Error("Access token and refresh token are required");
    }

    try {
      await db("accounts").insert({
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
    } catch (error) {
      console.error("Error adding account:", error);
      logger.log("error", `Error adding account: ${error}`);
    }
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

    try {
      const query = db("accounts").where(function () {
        this.where("email", identifier).orWhere("username", identifier);
      });

      if (type) {
        query.andWhere("type", type);
      }

      return await query.first();
    } catch (error) {
      console.error("Error fetching account:", error);
      logger.log("error", `Error fetching account: ${error}`);
      return null;
    }
  }

  async getAccounts(type?: string): Promise<Array<ExternalAccount>> {
    await this.init();

    try {
      const query = db("accounts");

      if (type) {
        query.andWhere("type", type);
      }

      return await query.select("*");
    } catch (error) {
      console.error("Error fetching accounts:", error);
      logger.log("error", `Error fetching accounts: ${error}`);
      return [];
    }
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
  ): Promise<void> {
    await this.init();

    try {
      const query = db("accounts").where(function () {
        this.where("email", identifier).orWhere("username", identifier);
      });

      if (type) {
        query.andWhere("type", type);
      }

      await query.update({
        access_token: input.access_token,
        refresh_token: input.refresh_token,
        expires_in: input.expires_in,
      });
    } catch (error) {
      console.error("Error updating tokens:", error);
      logger.log("error", `Error updating tokens: ${error}`);
    }
  }

  /**
   * Deletes an account from the database by email, username, or type
   * @param identifier The email, username, or type of the account to delete
   * @param type The type of account to delete, if specified
   */
  async deleteAccount(identifier: string, type?: string): Promise<void> {
    await this.init();

    try {
      const query = db("accounts").where(function () {
        this.where("email", identifier).orWhere("username", identifier);
      });

      if (type) {
        query.andWhere("type", type);
      }

      await query.del();
    } catch (error) {
      console.error("Error deleting account:", error);
      logger.log("error", `Error deleting account: ${error}`);
    }
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
  ): Promise<void> {
    await this.init();

    const account = await this.getAccount(identifier, type);
    if (!account) {
      console.error("Account not found for token refresh");
      return;
    }

    const now = new Date();
    const expiresAt = new Date(account.expires_in);

    if (expiresAt <= now) {
      try {
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
      } catch (error) {
        console.error("Error refreshing tokens:", error);
        logger.log("error", `Error refreshing tokens: ${error}`);
      }
    }
  }
}

const accountsDB = new AccountsDB();

export { accountsDB };
