/// <reference types="vite/client" />

interface Window {
	// expose in the `electron/preload/index.ts`
	ipcRenderer: import("electron").IpcRenderer;

	// Add type definitions for the environment variables
	env: {
		NODE_ENV: string | undefined;
		IS_DEV: boolean;
		IS_PROD: boolean;
		CUSTOM_VAR: string | undefined;
		APP_VERSION: string | undefined;
	};
}
