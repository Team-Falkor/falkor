import type { PluginSearchResponse } from "@team-falkor/shared-types";
import type { SettingsConfig } from "@/@types";
import { SettingsManager } from "../settings/settings";
import { debridProviders } from "./map";

const settings = SettingsManager.getInstance();

type Return = { url: string; type: "ddl" | "magnet" | "torrent" } | undefined;

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
		const client = debridProviders.get("real-debrid");
		if (!client) return null;

		const donwloadURL =
			type === "ddl"
				? (await client.unrestrict.unrestrictLink(url))?.download
				: (await client.downloadTorrentFromMagnet(url))?.download;

		return {
			url: !donwloadURL ? "" : donwloadURL,
			type: type,
		};
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

		switch (preferedDebridService) {
			case "real-debrid": {
				const result = await this.realDebrid(url, type, _password);
				return result;
			}
			case "torbox": {
				// TODO: torbox
				return null;
			}

			default: {
				// TODO: default use first debrid service from the map
				return null;
			}
		}
	}
}
