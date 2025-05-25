import { EventEmitter } from "node:events";
import { db } from "@backend/database";
import { accounts } from "@backend/database/schemas";
import type { InferInsertModel } from "drizzle-orm";

type Account = InferInsertModel<typeof accounts>;

export interface RealDebridDeviceCode {
	device_code: string;
	user_code: string;
	interval: number;
	expires_in: number;
	verification_url: string;
}

export interface RealDebridCredentials {
	client_id: string;
	client_secret: string;
}

export interface RealDebridToken {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

export interface RealDebridClientInfo {
	client_id: string;
	client_secret: string;
}

export class RealDebridAuthService extends EventEmitter {
	private static instance: RealDebridAuthService;
	private baseUrl = "https://api.real-debrid.com";
	private oauthUrl = `${this.baseUrl}/oauth/v2`;

	private clientId: string;
	private clientSecret?: string;
	private pollingTimeout?: NodeJS.Timeout;

	private constructor() {
		super();
		this.clientId = "X245A4XAIBGVM";
	}

	setClientSecret(clientSecret: string) {
		this.clientSecret = clientSecret;
	}
	setClientId(clientId: string) {
		this.clientId = clientId;
	}

	public static getInstance(): RealDebridAuthService {
		if (!RealDebridAuthService.instance) {
			RealDebridAuthService.instance = new RealDebridAuthService();
		}
		return RealDebridAuthService.instance;
	}

	// Step 1: Obtain device and user codes
	public async getDeviceCode(): Promise<RealDebridDeviceCode> {
		const url = `${this.oauthUrl}/device/code?client_id=${this.clientId}&new_credentials=yes`;

		try {
			const response = await fetch(url);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to obtain device code");
			}

			return {
				device_code: data.device_code,
				user_code: data.user_code,
				interval: Number.parseInt(data.interval, 10),
				expires_in: Number.parseInt(data.expires_in, 10),
				verification_url: data.verification_url,
			};
		} catch (error) {
			console.error("Error obtaining device code:", error);
			throw error;
		}
	}

	// Step 2: Poll for user authorization and credentials
	public startPollingForToken(deviceCode: string): void {
		// Clear any existing polling
		if (this.pollingTimeout) {
			clearTimeout(this.pollingTimeout);
		}

		this.pollForCredentials(deviceCode);
	}

	private async pollForCredentials(deviceCode: string): Promise<void> {
		const url = `${this.oauthUrl}/device/credentials?client_id=${this.clientId}&code=${deviceCode}`;

		try {
			const response = await fetch(url);
			console.log("Polling for credentials:", response.status);
			const data = await response.json();

			if (response.ok && data.client_id && data.client_secret) {
				// We got credentials, now get the token
				this.clientId = data.client_id;
				this.clientSecret = data.client_secret;

				try {
					const token = await this.obtainAccessToken(deviceCode);

					// Store the token in the database
					const account = await this.upsertAccountToken(token, {
						client_id: data.client_id,
						client_secret: data.client_secret,
					});

					this.emit("token", { token, account });
				} catch (error) {
					this.emit("error", { error });
				}
			} else if (response.status === 403 || response.status === 400) {
				// Continue polling
				this.pollingTimeout = setTimeout(() => {
					this.pollForCredentials(deviceCode);
				}, 5500); // Poll every 5.5 seconds
			} else if (!response.ok) {
				// Some other unexpected error occurred
				this.emit("error", {
					error: new Error(
						data.error || `Polling failed with status ${response.status}`,
					),
				});
			}
		} catch (error) {
			console.log(error);
			this.emit("error", { error });
		}
	}

	// Step 3: Obtain access token
	private async obtainAccessToken(
		deviceCode: string,
	): Promise<RealDebridToken> {
		const url = `${this.oauthUrl}/token`;
		const body = `client_id=${this.clientId}&client_secret=${this.clientSecret}&code=${deviceCode}&grant_type=http://oauth.net/grant_type/device/1.0`;

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});

		const data = await response.json();

		if (!response.ok || !data.access_token || !data.refresh_token) {
			throw new Error(data.error || "Failed to obtain access token");
		}

		return {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type,
		};
	}

	// Step 4: Refresh the access token
	public async refreshToken(refreshToken: string): Promise<RealDebridToken> {
		const url = `${this.oauthUrl}/token`;

		const body = `client_id=${this.clientId}&client_secret=${this.clientSecret}&code=${refreshToken}&grant_type=http://oauth.net/grant_type/device/1.0`;

		console.log(body);

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		console.log(response);

		const data = await response.json();

		if (!response.ok || !data.access_token || !data.refresh_token) {
			throw new Error(data.error || "Failed to refresh access token");
		}

		const token = {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type,
		};

		// Update the token in the database
		await this.upsertAccountToken(token);

		return token;
	}

	/**
	 * Unified upsert for account tokens.
	 */
	private async upsertAccountToken(
		token: RealDebridToken,
		clientInfo?: RealDebridClientInfo,
	): Promise<Account> {
		const payload: Partial<Account> = {
			type: "real-debrid",
			accessToken: token.access_token,
			refreshToken: token.refresh_token,
			expiresIn: token.expires_in,
			...(clientInfo && {
				clientId: clientInfo.client_id,
				clientSecret: clientInfo.client_secret,
			}),
		};

		const accountEntry = await db
			.insert(accounts)
			.values(payload)
			.onConflictDoUpdate({
				target: [accounts.type],
				set: payload,
			})
			.returning()
			.get();

		return accountEntry;
	}

	// Helper method to check if token is expired
	public isTokenExpired(expiresIn: number, timestamp: number): boolean {
		const expiryTime = timestamp + expiresIn * 1000;
		return Date.now() > expiryTime;
	}

	// Clean up method to stop polling
	public stopPolling(): void {
		if (this.pollingTimeout) {
			clearTimeout(this.pollingTimeout);
			this.pollingTimeout = undefined;
		}
	}
}
