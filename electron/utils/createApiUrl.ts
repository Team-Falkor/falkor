import { SettingsManager } from "@backend/handlers/settings/settings";

const settings = SettingsManager.getInstance();
const apiUrl = settings.get("api_base_url")?.toString();

export const createApiUrl = (path: string) => {
	if (!apiUrl) throw new Error("API URL is not set");
	return new URL(path, apiUrl).toString();
};
