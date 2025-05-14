import { BrowserWindow, ipcMain } from "electron";
import { INDEX_HTML, PRELOAD_PATH, VITE_DEV_SERVER_URL } from "./constants";

export function setupIPC(): void {
	// New window example arg: new windows url
	ipcMain.handle("open-win", (_, arg: string) => {
		const childWindow = new BrowserWindow({
			webPreferences: {
				preload: PRELOAD_PATH,
				nodeIntegration: true,
				contextIsolation: false,
			},
		});

		if (VITE_DEV_SERVER_URL) {
			childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
		} else {
			childWindow.loadFile(INDEX_HTML, { hash: arg });
		}
	});
}
