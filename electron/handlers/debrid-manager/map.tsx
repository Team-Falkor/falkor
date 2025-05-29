import { db } from "@backend/database";
import { accounts } from "@backend/database/schemas";
import { eq } from "drizzle-orm";
import {
	RealDebridAuthService,
	RealDebridClient,
} from "../api-wrappers/real-debrid";
import type { DebridCachingManager } from "./debridCachingManager";

type DebridService = RealDebridClient;

type DebriServiceType = "real-debrid" | "torbox";

export const debridProviders: Map<DebriServiceType, DebridService> = new Map();

export const debridCachingItems: Map<string, DebridCachingManager> = new Map();

const updateAccountTokensInDb = async (
	provider: "real-debrid",
	accessToken: string,
	refreshToken: string | null,
	expiresIn: number,
): Promise<boolean> => {
	try {
		// expiresIn is in seconds, store it as the future timestamp
		const expiryDate = new Date(Date.now() + expiresIn * 1000);

		const updatedAccounts = await db
			.update(accounts)
			.set({
				accessToken,
				refreshToken,
				expiresIn: expiryDate.getTime(), // Store as milliseconds timestamp
			})
			.where(eq(accounts.type, provider))
			.returning({ id: accounts.id });

		return updatedAccounts.length > 0;
	} catch (error) {
		console.error(`Failed to update tokens in DB for ${provider}:`, error);
		return false; // Indicate failure
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

			if (tokenResponse) {
				const {
					access_token: newAccessToken,
					refresh_token: newRefreshToken,
					expires_in: newExpiresIn,
				} = tokenResponse;

				const dbUpdated = await updateAccountTokensInDb(
					"real-debrid",
					newAccessToken,
					newRefreshToken,
					newExpiresIn,
				);

				if (dbUpdated) {
					console.info(
						"RealDebrid: Token refreshed and database updated successfully.",
					);
					tokenToUse = newAccessToken;
					client = RealDebridClient.getInstance(tokenToUse);
					debridProviders.set("real-debrid", client);
				} else {
					console.error(
						"RealDebrid: Token refreshed, but failed to update database.",
					);
					throw new Error(
						"RealDebrid: Token refreshed but database update failed.",
					);
				}
			} else {
				console.error(
					"RealDebrid: Token refresh attempt failed (no response from auth service).",
				);
				throw new Error("RealDebrid: Token refresh failed.");
			}
		} catch (error) {
			console.error("RealDebrid: Error during token refresh process.", error);
			if (error instanceof Error) throw error;
			throw new Error(
				"An unknown error occurred during RealDebrid token refresh.",
			);
		}
	}

	if (forceReinitialize) {
		console.info(
			"RealDebrid: `forceReinitialize` is true. Re-creating client with the latest token.",
		);
		client = RealDebridClient.getInstance(tokenToUse);
		debridProviders.set("real-debrid", client);
		return client;
	}

	if (client) {
		console.info(
			"RealDebrid: Returning existing or refreshed client instance.",
		);
		return client;
	}

	console.info("RealDebrid: No client instance found. Initializing a new one.");
	client = RealDebridClient.getInstance(tokenToUse);
	debridProviders.set("real-debrid", client);
	return client;
};

// TODO: torbox

(async () => {
	const externalAccounts = await db.select().from(accounts);
	const realDebridFromDB = externalAccounts.find(
		(account) => account.type === "real-debrid",
	);
	const now = new Date();

	// expiresIn from DB is now a future timestamp in milliseconds
	const expiresInTimestamp = realDebridFromDB?.expiresIn ?? 0;
	const hasExpired = expiresInTimestamp < now.getTime();

	if (
		realDebridFromDB?.accessToken &&
		realDebridFromDB?.clientSecret &&
		realDebridFromDB?.clientId
	) {
		await initRealDebrid(
			realDebridFromDB.accessToken,
			realDebridFromDB.refreshToken,
			realDebridFromDB.clientSecret,
			realDebridFromDB.clientId,
			hasExpired,
			true,
		);
	}
})();
