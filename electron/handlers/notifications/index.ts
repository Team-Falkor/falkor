import { createWriteStream, existsSync } from "node:fs";
import https from "node:https";
import { join } from "node:path";
import { constants } from "@backend/utils/constants";
import { playSound } from "@backend/utils/playsound";
import { Notification, type NotificationConstructorOptions } from "electron";
import type { NotificationType } from "@/@types";
import logger from "../logging";
import { SettingsManager } from "../settings/settings";

const settings = SettingsManager.getInstance();

class NotificationsHandler {
	private constructor() {}

	public static constructNotification = async (
		options?: NotificationConstructorOptions & {
			notificationType?: NotificationType;
		},
		show = true,
	) => {
		try {
			const setting = settings.get("notifications");
			if (!setting) {
				console.log("Notifications are disabled in settings.");
				return;
			}

			console.log("Constructing notification...");

			const notification = new Notification({
				...options,
				silent: true,
			});

			if (!show) {
				console.log("Notification not shown (show is false).");
				return notification;
			}

			notification.show();
			console.log("Notification shown.");

			let soundPath: string | null = null;
			switch (options?.notificationType) {
				case "download_completed":
					soundPath = constants.assets.sounds.complete;
					console.log(
						"Notification type: download_completed. Sound path:",
						soundPath,
					);
					break;
				case "achievement_unlocked":
					soundPath = constants.assets.sounds.achievement_unlocked;
					console.log(
						"Notification type: achievement_unlocked. Sound path:",
						soundPath,
					);
					break;
				default:
					console.error(
						"Unknown notification type:",
						options?.notificationType,
					);
					break;
			}

			if (!soundPath) {
				console.log("No sound file for notification type.");
				return;
			}

			console.log("Playing sound:", soundPath);
			try {
				await playSound(soundPath);
			} catch (error) {
				console.error("Error playing notification sound:", error);
			}
		} catch (error) {
			console.error("Error creating notification:", error);
		}
	};

	/**
	 * Downloads an image from the given URL and saves it to the cache path.
	 * @param url - The URL of the image to download.
	 * @param extra - Optional additional parameters, including a custom file name.
	 * @returns The path to the saved image or undefined if an error occurs.
	 */
	public static async createImage(
		url: string,
		extra?: {
			fileName?: string;
		},
	): Promise<string | undefined> {
		if (!url) {
			console.log("Invalid URL provided for image download.");
			logger.log("error", "Invalid URL provided for image download.");
			return undefined;
		}

		try {
			console.log("Downloading image from URL:", url);

			const fileName =
				extra?.fileName ||
				new URL(url).pathname.split("/").pop() ||
				"image.png";
			const output = join(constants.cachePath, fileName);

			if (existsSync(output)) {
				console.log("File already exists:", output);
				logger.log("info", `File already exists: ${output}`);
				return output;
			}

			console.log("Image file not found, downloading...");
			return await NotificationsHandler.downloadImage(url, output);
		} catch (error) {
			console.error("Error creating image:", error);
			logger.log("error", `Error creating image: ${(error as Error).message}`);
			return undefined;
		}
	}

	/**
	 * Handles downloading an image and saving it to a specified file.
	 * @param url - The URL of the image to download.
	 * @param output - The path to save the downloaded image.
	 * @returns A promise that resolves to the output path on success or rejects on failure.
	 */
	private static downloadImage(url: string, output: string): Promise<string> {
		return new Promise((resolve, reject) => {
			// console.log("Starting download for image:", url);

			https
				.get(url, { timeout: 10000 }, (response) => {
					if (response.statusCode !== 200) {
						const errorMsg = `Failed to fetch image. Status code: ${response.statusCode}`;
						console.error(errorMsg);
						reject(new Error(errorMsg));
						return;
					}

					const writeStream = createWriteStream(output);
					response.pipe(writeStream);

					writeStream.on("finish", () => {
						console.log("Image downloaded successfully:", output);
						logger.log("info", `Image downloaded successfully: ${output}`);
						resolve(output);
					});

					writeStream.on("error", (error) => {
						const errorMsg = `File write error: ${error.message}`;
						console.error(errorMsg);
						logger.log("error", errorMsg);
						reject(new Error(errorMsg));
					});
				})
				.on("error", (error) => {
					const errorMsg = `Request error: ${error.message}`;
					console.error(errorMsg);
					logger.log("error", errorMsg);
					reject(new Error(errorMsg));
				});
		});
	}
}

export { NotificationsHandler };
