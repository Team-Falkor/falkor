import type { PluginSearchResponse } from "@team-falkor/shared-types";
import { SettingsManager } from "../settings/settings";
import { debridProviders } from "./map";

const settings = SettingsManager.getInstance();

type Return = { url: string; type: "ddl" | "magnet" | "torrent" } | undefined;

export class DebridManager {
	private static instance: DebridManager;

	getInstance() {
		if (!DebridManager.instance) DebridManager.instance = new DebridManager();
		return DebridManager.instance;
	}

	private downloadWithRealDebrid = async (
		data: Omit<PluginSearchResponse, "return">,
		url: string,
		_password?: string,
	): Promise<Return> => {
		const account = settings.get("useAccountsForDownloads");
		if (!account) return;

		const client = debridProviders.get("real-debrid");
		if (!client) return;

		const donwloadURL =
			data.type === "ddl"
				? (await client.unrestrict.unrestrictLink(url))?.download
				: await client.downloadTorrentFromMagnet(url);

		return {
			url: donwloadURL,
			type: data.type,
		};
	};
}
