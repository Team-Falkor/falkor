import pluginProviderHandler from "@backend/handlers/plugins/providers/handler";
import { BrowserWindow } from "electron";
import { sendToastNotification } from "./window";

// Memoized main window
let mainWindow: BrowserWindow | null = null;

const getMainWindow = (): BrowserWindow | null => {
	if (mainWindow && !mainWindow.isDestroyed()) {
		return mainWindow;
	}
	mainWindow = BrowserWindow.getAllWindows()[0] ?? null;
	return mainWindow;
};

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
		}
	}
};
