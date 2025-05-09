import { EventEmitter } from "node:events";
import { db } from "@backend/database";
import { accounts } from "@backend/database/schemas";
import type { InferInsertModel } from "drizzle-orm";
import type { RealDebridDeviceCode, RealDebridToken } from "../@types";

type Account = InferInsertModel<typeof accounts>;

/**
 * RealDebridAuthService handles the OAuth2 device code flow for Real-Debrid authentication.
 * It centralizes token persistence and polling logic, with clear method naming and type safety.
 */
export class RealDebridAuthService extends EventEmitter {
	private static readonly CLIENT_ID =
		process.env.REAL_DEBRID_CLIENT_ID ?? "X245A4XAIBGVM";
	private static readonly OAUTH_BASE = "https://api.real-debrid.com/oauth/v2";
	private pollingTimer: NodeJS.Timeout | null = null;

	constructor(private readonly pollingIntervalMs = 5000) {
		super();
	}

	/**
	 * Unified upsert for account tokens.
	 */
	private async upsertAccountToken(token: RealDebridToken): Promise<Account> {
		const payload: Partial<Account> = {
			type: "real-debrid",
			accessToken: token.access_token,
			refreshToken: token.refresh_token,
			expiresIn: token.expires_in,
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

	/**
	 * Performs OAuth form-encoded POST and parses errors, returning typed response.
	 */
	private async oauthRequest<T>(
		path: string,
		params: Record<string, string>,
	): Promise<T> {
		const body = new URLSearchParams({
			client_id: RealDebridAuthService.CLIENT_ID,
			...params,
		}).toString();
		const res = await fetch(`${RealDebridAuthService.OAUTH_BASE}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		const data = await res.json();
		if (!res.ok) {
			const msg = data.error_description ?? data.message ?? res.statusText;
			throw new Error(
				`RealDebrid OAuth error (${data.error ?? res.status}): ${msg}`,
			);
		}
		return data as T;
	}

	/**
	 * Step 1: Get a new device code.
	 */
	public getDeviceCode(): Promise<RealDebridDeviceCode> {
		return this.oauthRequest<RealDebridDeviceCode>("/device/code", {
			new_credentials: "yes",
		});
	}

	/**
	 * Step 2: Poll until the device code is authorized.
	 */
	public startPollingForToken(deviceCode: string): void {
		this.emit("polling_start", { deviceCode });
		this.stopPolling();

		this.pollingTimer = setInterval(async () => {
			try {
				const token = await this.checkToken(deviceCode);
				if (token) {
					const account = await this.upsertAccountToken(token);
					this.emit("token", { token, account });
					this.stopPolling();
				}
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				if (["authorization_pending", "slow_down"].includes(message)) {
					return;
				}
				this.emit("error", new Error(message));
				this.stopPolling();
			}
		}, this.pollingIntervalMs);
	}

	/**
	 * Step 3: Exchange device code for tokens.
	 */
	private checkToken(deviceCode: string): Promise<RealDebridToken | null> {
		return this.oauthRequest<RealDebridToken>("/token", {
			code: deviceCode,
			grant_type: "http://oauth.net/grant_type/device/1.0",
		});
	}

	/**
	 * Step 4: Refresh an existing token.
	 */
	public async refreshToken(refreshToken: string): Promise<RealDebridToken> {
		const token = await this.oauthRequest<RealDebridToken>("/token", {
			refresh_token: refreshToken,
			grant_type: "refresh_token",
		});
		await this.upsertAccountToken(token);
		return token;
	}

	/**
	 * Stop any ongoing polling interval.
	 */
	public stopPolling(): void {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer);
			this.pollingTimer = null;
		}
	}

	/**
	 * Check if a token has expired.
	 */
	public isTokenExpired(expiresIn: number, receivedAt: number): boolean {
		return Date.now() >= receivedAt + expiresIn * 1000;
	}
}
