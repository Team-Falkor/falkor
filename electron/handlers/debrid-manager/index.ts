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
	  }
	| undefined;

// TODO: handle downloading on debrid server

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
			returnData = {
				url: result.download,
				isCaching: ["downloading", "queued", "uploading"].includes(
					result.status,
				),
				type: "ddl",
				provider,
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
