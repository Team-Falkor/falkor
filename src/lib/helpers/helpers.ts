import type { SettingsTitleBarStyle, Website } from "@/@types";

export const getSteamIdFromUrl = (url: string) =>
	url.match(/\/app\/(\d+)(\/|$)/)?.[1];

export const getSteamIdFromWebsites = (websites: Website[]) => {
	const find_steam_url = websites?.find((site) =>
		site.url.startsWith("https://store.steampowered.com/app"),
	);

	if (!find_steam_url) return undefined;

	return getSteamIdFromUrl(find_steam_url?.url);
};

export const createSlug = (str: string) => {
	return str
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^\w\s]/g, "")
		.replace(/\s+/g, "-")
		.replace(/^-+/, "")
		.replace(/-+$/, "");
};

export const shouldHideTitleBar = (
	titleBarStyle: SettingsTitleBarStyle | undefined,
) => {
	if (!titleBarStyle) return false;
	return ["none", "native"].includes(titleBarStyle);
};
