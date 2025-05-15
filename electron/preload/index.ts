import { contextBridge, ipcRenderer } from "electron";
import { exposeElectronTRPC } from "trpc-electron/main";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
	on(...args: Parameters<typeof ipcRenderer.on>) {
		const [channel, listener] = args;
		return ipcRenderer.on(channel, (event, ...args) =>
			listener(event, ...args),
		);
	},
	off(...args: Parameters<typeof ipcRenderer.off>) {
		const [channel, ...omit] = args;
		return ipcRenderer.off(channel, ...omit);
	},
	send(...args: Parameters<typeof ipcRenderer.send>) {
		const [channel, ...omit] = args;
		return ipcRenderer.send(channel, ...omit);
	},
	invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
		const [channel, ...omit] = args;
		return ipcRenderer.invoke(channel, ...omit);
	},
	once(...args: Parameters<typeof ipcRenderer.once>) {
		const [channel, listener] = args;
		return ipcRenderer.once(channel, (event, ...args) =>
			listener(event, ...args),
		);
	},
	removeAllListeners(
		...args: Parameters<typeof ipcRenderer.removeAllListeners>
	) {
		const [channel, ...omit] = args;
		return ipcRenderer.removeAllListeners(channel, ...omit);
	},
});

contextBridge.exposeInMainWorld("env", {
	NODE_ENV: process.env.NODE_ENV,
	IS_DEV: process.env.NODE_ENV !== "production",
	IS_PROD: process.env.NODE_ENV === "production",
	CUSTOM_VAR: process.env.CUSTOM_VAR,
	APP_VERSION: process.env.npm_package_version,
});

process.on("loaded", async () => {
	exposeElectronTRPC();
});
