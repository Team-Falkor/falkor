/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
    VITE_TWITCH_CLIENT_ID: string;
    VITE_TWITCH_CLIENT_SECRET: string;
    VITE_ITAD_API_KEY: string;
    VITE_RD_CLIENT_ID: string;
    VITE_STEAMGRIDDB_API_KEY?: string;
    FALKOR_API_BASE_URL?: string;
    debug?: boolean;

    [key: string]: string | undefined;
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import("electron").IpcRenderer & {
    dialog: import("electron").Dialog;
  };
}
