import { db } from "@backend/database";
import { accounts } from "@backend/database/schemas";
import { sendToastNotification } from "@backend/main/window";
import { eq } from "drizzle-orm";
import {
	RealDebridAuthService,
	RealDebridClient,
} from "../api-wrappers/real-debrid";
import { TorBoxClient } from "../api-wrappers/torbox";
import type { DebridCachingManager } from "./debridCachingManager";

export type DebridService = RealDebridClient | TorBoxClient;
type DebridServiceType = "real-debrid" | "torbox";

export const debridProviders: Map<DebridServiceType, DebridService> = new Map();
export const debridCachingItems: Map<string, DebridCachingManager> = new Map();

const MILLISECONDS_PER_SECOND = 1000;

// Add initialization tracking
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

const updateAccountTokensInDb = async (
	provider: "real-debrid",
	accessToken: string,
	refreshToken: string | null,
	expiresIn: number,
): Promise<boolean> => {
	try {
		const expiryDate = new Date(
			Date.now() + expiresIn * MILLISECONDS_PER_SECOND,
		);

		const updatedAccounts = await db
			.update(accounts)
			.set({
				accessToken,
				refreshToken,
				expiresIn: expiryDate.getTime(),
			})
			.where(eq(accounts.type, provider))
			.returning({ id: accounts.id });

		return updatedAccounts.length > 0;
	} catch (error) {
		console.error(`Failed to update tokens in DB for ${provider}:`, error);
		return false;
	}
};

export const initRealDebrid = async (
	currentAccessToken: string,
	currentRefreshToken: string | null,
	clientSecret: string,
	clientId: string,
	hasExpired = false,
	forceReinitialize = false,
): Promise<RealDebridClient> => {
	if (!currentAccessToken || !clientSecret || !clientId) {
		throw new Error("RealDebrid: Missing required authentication parameters");
	}

	let client = debridProviders.get("real-debrid") as
		| RealDebridClient
		| undefined;
	let tokenToUse = currentAccessToken;

	if (hasExpired) {
		if (!currentRefreshToken) {
			console.error(
				"RealDebrid: Token is expired, but no refresh token is available.",
			);
			throw new Error("RealDebrid: Token expired, no refresh token provided.");
		}

		try {
			console.info("RealDebrid: Token expired. Attempting refresh...");
			const realDebridAuthService = RealDebridAuthService.getInstance();
			realDebridAuthService.setClientSecret(clientSecret);
			realDebridAuthService.setClientId(clientId);

			const tokenResponse =
				await realDebridAuthService.refreshToken(currentRefreshToken);

			if (!tokenResponse) {
				throw new Error("RealDebrid: Token refresh failed - no response");
			}

			const {
				access_token: newAccessToken,
				refresh_token: newRefreshToken,
				expires_in: newExpiresIn,
			} = tokenResponse;

			if (!newAccessToken) {
				throw new Error(
					"RealDebrid: Invalid refresh response - missing access token",
				);
			}

			const dbUpdated = await updateAccountTokensInDb(
				"real-debrid",
				newAccessToken,
				newRefreshToken,
				newExpiresIn,
			);

			if (!dbUpdated) {
				throw new Error(
					"RealDebrid: Token refreshed but database update failed.",
				);
			}

			console.info(
				"RealDebrid: Token refreshed and database updated successfully.",
			);
			tokenToUse = newAccessToken;
			client = RealDebridClient.getInstance(tokenToUse);
			debridProviders.set("real-debrid", client);
		} catch (error) {
			console.error("RealDebrid: Error during token refresh process.", error);
			throw error instanceof Error
				? error
				: new Error(
						"An unknown error occurred during RealDebrid token refresh.",
					);
		}
	}

	if (forceReinitialize || !client) {
		const action = forceReinitialize
			? "Re-creating client due to forceReinitialize"
			: "Creating new client instance";
		console.info(`RealDebrid: ${action}.`);

		client = RealDebridClient.getInstance(tokenToUse);
		debridProviders.set("real-debrid", client);
	} else {
		console.info("RealDebrid: Returning existing client instance.");
	}

	return client;
};

export const initTorBox = async (
	currentApiKey: string,
	forceReinitialize = false,
): Promise<TorBoxClient> => {
	if (!currentApiKey) {
		throw new Error("TorBox: Missing required Api Key");
	}

	let client = debridProviders.get("torbox") as TorBoxClient | undefined;

	if (forceReinitialize || !client) {
		const action = forceReinitialize
			? "Re-creating client due to forceReinitialize"
			: "Creating new client instance";
		console.info(`RealDebrid: ${action}.`);

		client = TorBoxClient.getInstance(currentApiKey);
		debridProviders.set("torbox", client);
	} else {
		console.info("TorBox: Returning existing client instance.");
	}

	return client;
};

// Initialize providers from database
const initializeProviders = async (): Promise<void> => {
	if (isInitialized) return;

	try {
		const externalAccounts = await db.select().from(accounts);
		const realDebridFromDB = externalAccounts.find(
			(account) => account.type === "real-debrid",
		);
		const torBoxFromDB = externalAccounts.find(
			(account) => account.type === "torbox",
		);
		if (!realDebridFromDB && !torBoxFromDB) {
			console.info("No RealDebrid or TorBox accounts found in database.");
			isInitialized = true;
			return;
		}
		if (realDebridFromDB) {
			const now = new Date();
			const expiresInTimestamp = realDebridFromDB.expiresIn ?? 0;
			const hasExpired = expiresInTimestamp < now.getTime();

			if (
				realDebridFromDB.accessToken &&
				realDebridFromDB.clientSecret &&
				realDebridFromDB.clientId
			) {
				await initRealDebrid(
					realDebridFromDB.accessToken,
					realDebridFromDB.refreshToken,
					realDebridFromDB.clientSecret,
					realDebridFromDB.clientId,
					hasExpired,
					true,
				);
				console.info("RealDebrid: Successfully initialized from database");
			} else {
				// Determine which credentials are missing
				const missingCredentials = [];
				if (!realDebridFromDB.accessToken)
					missingCredentials.push("Access Token");
				if (!realDebridFromDB.clientSecret)
					missingCredentials.push("Client Secret");
				if (!realDebridFromDB.clientId) missingCredentials.push("Client ID");

				const missingItems = missingCredentials.join(", ");

				console.warn("RealDebrid: Missing required credentials in database");

				sendToastNotification({
					type: "error",
					message: "RealDebrid Configuration Error",
					description: `Missing required credentials: ${missingItems}. Please reconfigure your RealDebrid account in settings.`,
				});
			}
		}

		if (torBoxFromDB) {
			if (torBoxFromDB.accessToken) {
				await initTorBox(torBoxFromDB.accessToken, true);
				console.info("TorBox: Successfully initialized from database");
			} else {
				console.warn("RealDebrid: Missing required credentials in database");

				sendToastNotification({
					type: "error",
					message: "TorBox Configuration Error",
					description:
						"Missing API key. Please reconfigure your TorBox account in settings.",
				});
			}
		}
	} catch (error) {
		console.error("RealDebrid: Failed to initialize from database:", error);
	} finally {
		isInitialized = true;
	}
};

// Export function to ensure initialization
export const ensureProvidersInitialized = async (): Promise<void> => {
	if (isInitialized) return;

	if (!initializationPromise) {
		initializationPromise = initializeProviders();
	}

	await initializationPromise;
};

// Start initialization immediately but don't block module loading
initializationPromise = initializeProviders();
