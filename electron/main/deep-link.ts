import { db } from "@backend/database";
import { externalProfiles } from "@backend/database/schemas";
import { SteamApi } from "@backend/handlers/api-wrappers/steam";
import pluginProviderHandler from "@backend/handlers/plugins/providers/handler";
import { searchParamsToObject } from "@backend/utils/search-params-to-object";
import { and, eq } from "drizzle-orm";
import { sendToastNotification } from "./window";

const steamapi = SteamApi.getInstance();

export const handleDeepLink = async (url: string): Promise<void> => {
	const deepLinkContent = url?.split("falkor://")?.[1];

	const command = deepLinkContent?.split("/")?.[0];
	const args = deepLinkContent?.split("/")?.slice(1);

	if (!command) return;

	switch (command) {
		case "install-plugin": {
			const url = args.join("/");

			if (!url.includes("setup.json")) return;

			const success = await pluginProviderHandler.install(url);

			if (success) {
				sendToastNotification({
					message: "Plugin installed successfully",
					description: "You can now use it in Falkor",
					type: "success",
				});

				return;
			}

			sendToastNotification({
				message: "Plugin installation failed",
				description: "Please try again later",
				type: "error",
			});
			break;
		}

		case "steam-login": {
			const url = args.join("/");

			const searchParamsObj = searchParamsToObject(url);

			const SteamProfile = await steamapi.loginWithSteam(searchParamsObj);

			if (!SteamProfile) {
				sendToastNotification({
					message: "Steam login failed",
					description: "Please try again later",
					type: "error",
				});
			}

			// get steam from external_profiles table
			const steamProfileFromDB = db
				.select()
				.from(externalProfiles)
				.where(
					and(
						eq(externalProfiles.type, "steam"),
						eq(externalProfiles.userId, SteamProfile.steamid),
					),
				)
				.get();

			// if not found, insert, if found Update their username/avatar in case it changed on Steam
			if (!steamProfileFromDB) {
				db.insert(externalProfiles).values({
					type: "steam",
					userId: SteamProfile.steamid,
					username: SteamProfile.personaname,
					avatar: SteamProfile.avatarfull,
				});

				sendToastNotification({
					message: "Steam linked successful",
					description: `${SteamProfile.personaname} has been linked to Falkor`,
					type: "success",
				});

				return;
			}

			// if found, update their username/avatar in case it changed on Steam
			if (steamProfileFromDB) {
				db.update(externalProfiles)
					.set({
						username: SteamProfile.personaname,
						avatar: SteamProfile.avatarfull,
					})
					.where(eq(externalProfiles.id, steamProfileFromDB.id));

				sendToastNotification({
					message: "Steam linked successful",
					description: `${SteamProfile.personaname} has been linked to Falkor`,
					type: "success",
				});

				return;
			}
			break;
		}
	}
};
