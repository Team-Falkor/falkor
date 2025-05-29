import type { PluginSearchResponse } from "@team-falkor/shared-types";
import type { SettingsConfig } from "@/@types";
import { SettingsManager } from "../settings/settings";
import { debridProviders } from "./map";

const settings = SettingsManager.getInstance();

type Return =
	| {
			url: string;
			type: "ddl" | "magnet" | "torrent";
			provider: "real-debrid" | "torbox";
			isCaching: boolean;
			progress?: number;
			fileSize?: number;
	  }
	| undefined;

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
		const provider = "real-debrid";
		const client = debridProviders.get(provider);
		if (!client) return null;

		let returnData: Return | null = null;
		if (type === "ddl") {
			const result = await client.unrestrict.unrestrictLink(url);
			returnData = {
				url: result?.download ?? "",
				isCaching: false,
				type: "ddl",
				provider,
			};
		}

		if (type !== "ddl") {
			const result = await client.downloadTorrentFromMagnet(url);

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
	};

	public async download(
		url: string,
		type: PluginSearchResponse["type"],
		_password?: string,
	): Promise<Return | null> {
		const account = settings.get("useAccountsForDownloads");
		if (!account) return null;

		// check prefered debrid service first if not set use first added service
		const preferedDebridService = settings.get(
			"preferredDebridService",
		) as SettingsConfig["preferredDebridService"];

		const service = preferedDebridService
			? preferedDebridService
			: debridProviders.keys().next().value;

		switch (service) {
			case "real-debrid": {
				const result = await this.realDebrid(url, type, _password);
				return result;
			}
			case "torbox": {
				// TODO: torbox
				return null;
			}
			default: {
				// No service found
				return null;
			}
		}
	}
}
