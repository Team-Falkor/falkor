import type { PluginSearchResponse } from "@team-falkor/shared-types";
import { ExternalAccountType, type SettingsConfig } from "@/@types";
import { SettingsManager } from "../settings/settings";
import { debridProviders } from "./map";

const settings = SettingsManager.getInstance();

type Return = { url: string; type: "ddl" | "magnet" | "torrent" } | undefined;

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
	): Promise<Return> => {
		const client = debridProviders.get("real-debrid");
		if (!client) return;

		const donwloadURL =
			type === "ddl"
				? (await client.unrestrict.unrestrictLink(url))?.download
				: await client.downloadTorrentFromMagnet(url);

		return {
			url: donwloadURL,
			type: type,
		};
	};

	public async download(
		url: string,
		type: PluginSearchResponse["type"],
		_password?: string,
	): Promise<Return | false> {
		const account = settings.get("useAccountsForDownloads");
		if (!account) return false;

		// check prefered debrid service first if not set use first added service
		const preferedDebridService = settings.get(
			"preferredDebridService",
		) as SettingsConfig["preferredDebridService"];

		switch (preferedDebridService) {
			case ExternalAccountType["real-debrid"]: {
				const result = await this.realDebrid(url, type, _password);
				return result;
			}
			case ExternalAccountType.torbox: {
				// TODO: torbox
				return false;
			}

			default: {
				// TODO: default use first debrid service from the map
				return false;
			}
		}
	}
}
