import { join } from "node:path";
import { app } from "electron";

type PathType =
	| "appData"
	| "documents"
	| "publicDocuments"
	| "localAppData"
	| "programData"
	| "winePrefix";

export class SaveDataLocator {
	private constructor() {}

	private static isWindows = process.platform === "win32";
	private static user = this.isWindows
		? undefined
		: app.getPath("home").split("/").pop();

	private static getSystemPath(type: PathType): string {
		if (SaveDataLocator.isWindows) {
			switch (type) {
				case "documents":
					return app.getPath("documents");
				case "publicDocuments":
					return join("C:", "Users", "Public", "Documents");
				case "localAppData":
					return join(app.getPath("appData"), "..", "Local");
				case "programData":
					return join("C:", "ProgramData");
				case "appData":
					return app.getPath("appData");
				case "winePrefix":
					return "";
				default:
					throw new Error(`Invalid path type: ${type}`);
			}
		}

		// Linux path handling
		const homeDir = app.getPath("home");
		// Use XDG base directory for Linux systems
		const xdgData =
			process.env.XDG_DATA_HOME || join(homeDir, ".local", "share");
		const wineDataPath = join(xdgData, "wine");

		switch (type) {
			case "documents":
				return join(homeDir, "Documents");
			case "publicDocuments":
				return join(wineDataPath, "drive_c", "users", "Public", "Documents");
			case "localAppData":
				return join(
					wineDataPath,
					"drive_c",
					"users",
					SaveDataLocator.user || "unknown",
					"AppData",
					"Local",
				);
			case "programData":
				return join(wineDataPath, "drive_c", "ProgramData");
			case "appData":
				return join(
					wineDataPath,
					"drive_c",
					"users",
					SaveDataLocator.user || "unknown",
					"AppData",
					"Roaming",
				);
			case "winePrefix":
				return wineDataPath;
			default:
				throw new Error(`Invalid path type: ${type}`);
		}
	}
}
