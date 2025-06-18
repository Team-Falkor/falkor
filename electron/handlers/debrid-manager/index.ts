import type { PluginSearchResponse } from "@team-falkor/shared-types";
import type { SettingsConfig } from "@/@types";
import { SettingsManager } from "../settings/settings";
import { debridProviders, ensureProvidersInitialized } from "./map";
import { TorBoxClient } from "../api-wrappers/torbox";
import { RealDebridClient } from "../api-wrappers/real-debrid";
import type { DebridService } from "./map";


const settings = SettingsManager.getInstance();

type Return = {
		url: string;
		type: "ddl" | "magnet" | "torrent";
		provider: "real-debrid" | "torbox";
		isCaching: boolean;
		progress?: number;
		fileSize?: number;
	};

function isTorBoxClient(c: DebridService): c is TorBoxClient {
return c instanceof TorBoxClient;
}

function isRealDebridClient(c: DebridService): c is RealDebridClient {
return c instanceof RealDebridClient;
}
export class DebridManager {
	private static instance: DebridManager;

	public static getInstance() {
		if (!DebridManager.instance) DebridManager.instance = new DebridManager();
		return DebridManager.instance;
	}

	private realDebrid = async (
		url: string,
		type: PluginSearchResponse["type"],
		_password?: string,
	): Promise<Return | null> => {
		// Ensure providers are initialized before accessing
		await ensureProvidersInitialized();

		const provider = "real-debrid";
		const client = debridProviders.get(provider);

		if (!client || !isRealDebridClient(client)) {
			console.error("RealDebrid: client not found or client is not a RealDebridClient");
			return null;
		}

		try {
			let returnData: Return | null = null;

			if (type === "ddl") {
				const result = await client.unrestrict.unrestrictLink(url);

				if (!result?.download) {
					console.error("RealDebrid: Failed to unrestrict link");
					return null;
				}

				returnData = {
					url: result.download,
					isCaching: false,
					type: "ddl",
					provider,
				};
			} else {
				// Handle magnet/torrent types
				const result = await client.downloadTorrentFromMagnet(url);
				if (!result) {
					console.error("RealDebrid: Failed to process torrent/magnet");
					return null;
				}
				const isCaching = ["downloading", "queued", "uploading"].includes(
					result.status,
				);
				const progress =
					result.status === "downloading"
						? (result.progress ?? undefined)
						: undefined;
				const fileSize =
					result.status === "downloading"
						? (result.size ?? undefined)
						: undefined;

				returnData = {
					url: result.download,
					isCaching,
					type: "ddl",
					provider,
					progress,
					fileSize,
				};
			}

			return returnData;
		} catch (error) {
			console.error("RealDebrid: Error processing request:", error);
			return null;
		}
	};

	private torbox = async (
		url: string,
		type: PluginSearchResponse["type"],
		_password?: string,
	): Promise<Return | null> => {
		// Ensure providers are initialized before accessing
		await ensureProvidersInitialized();

		const provider = "torbox";
		const client = debridProviders.get(provider);

		if (!client || !isTorBoxClient(client)) {
			console.error("TorBox: client not found or client is not a TorBoxClient");
			return null;
		}

		try {
			let returnData: Return | null = null;

			if (type === "ddl") {
				const result = await client.webDownloads.createWebDownload(url);

				if (result) {
					returnData = {
						url: await client.webDownloads.getWebDownloadDownload(result.id),
						isCaching: !result.download_present,
						type: "ddl",
						provider,
						progress: result.progress,
						fileSize: result.size,
					}
				}
			} else {
				// Handle magnet/torrent types
				const result = await client.downloadTorrentFromMagnet(url);
				if (!result) {
					console.error("RealDebrid: Failed to process torrent/magnet");
					return null;
				}


				if (result.download_present) {
					const repsonse = await client.torrents.getZipDL(result.id.toString());
					if (!repsonse) {
						console.error(`TorBox: Failed to get download URL for torrent ${result.name}`);
						return null;
					}
					url = repsonse;
				}

				returnData = {
					url: url,
					isCaching: !result.download_present,
					type: "ddl",
					provider: provider,
					progress: result.progress,
					fileSize: result.size,
				};
			}

			return returnData;
		} catch (error) {
			console.error("RealDebrid: Error processing request:", error);
			return null;
		}
	};

	public async download(
		url: string,
		type: PluginSearchResponse["type"],
		_password?: string,
	): Promise<Return | null> {
		// Ensure providers are initialized
		await ensureProvidersInitialized();

		const account = settings.get("useAccountsForDownloads");
		if (!account) {
			console.log("No account found for download");
			return null;
		}

		// Check preferred debrid service first, if not set use first available service
		const preferredDebridService = settings.get(
			"preferredDebridService",
		) as SettingsConfig["preferredDebridService"];

		console.log("Preferred debrid service:", preferredDebridService);

		// Determine which service to use
		let service = preferredDebridService;
		if (!service) {
			const firstAvailableService = debridProviders.keys().next().value;
			if (!firstAvailableService) {
				console.log("No debrid services available");
				return null;
			}
			service = firstAvailableService;
		}

		console.log("Using debrid service:", service);

		try {
			switch (service) {
				case "real-debrid": {
					const result = await this.realDebrid(url, type, _password);
					return result;
				}
				case "torbox": {
					const result = await this.torbox(url, type, _password);
					return result;
				}
				default: {
					console.log("Unknown debrid service:", service);
					return null;
				}
			}
		} catch (error) {
			console.error(`Error using ${service} service:`, error);
			return null;
		}
	}
}
