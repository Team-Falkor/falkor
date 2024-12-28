import { app, BrowserWindow, Menu, nativeImage, screen, Tray } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { settings } from "../utils/settings/settings";
import { client } from "./torrent";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

class Window {
  window: BrowserWindow | null = null;
  tray: Tray | null = null;

  screenWidth: number = 0;
  screenHeight: number = 0;

  public createWindow() {
    if (this.window) return this.window; // Prevent re-creating the window

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    this.screenWidth = width;
    this.screenHeight = height;

    const titleBarStyle = settings.get("titleBarStyle");
    const frame = titleBarStyle === "native" || titleBarStyle === "none";

    const win = new BrowserWindow({
      icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
      webPreferences: {
        preload: path.join(__dirname, "preload.mjs"),
        // devTools: !app.isPackaged,
        devTools: true,
      },
      backgroundColor: "#020817",
      autoHideMenuBar: false,
      minWidth: 1000,
      minHeight: 600,
      frame,
      width: Math.min(width * 0.8, 1000),
      height: Math.min(height * 0.8, 600),
      resizable: true,
    });

    const loadURL =
      VITE_DEV_SERVER_URL || `file://${path.join(RENDERER_DIST, "index.html")}`;
    win.loadURL(loadURL);

    // if (app.isPackaged) win.setMenu(null);

    this.setupSettings();

    // Initialize tray only when needed, and only once
    if (!this.tray) this.createTray();

    this.window = win;
    return win;
  }

  private createTray() {
    if (this.tray) return; // Prevent re-creating tray

    const trayIconPath = path.join(process.env.VITE_PUBLIC, "icon.png");
    if (!trayIconPath) return; // Guard against missing icon path

    const trayImage = nativeImage.createFromPath(trayIconPath);
    const tray = new Tray(trayImage);
    tray.setToolTip("Falkor");

    tray.setContextMenu(this.createContextMenu());

    tray.on("double-click", () => this.showWindow());

    this.tray = tray;
  }

  private createContextMenu() {
    return Menu.buildFromTemplate([
      {
        type: "normal",
        label: "Open Falkor",
        click: () => this.showWindow(),
      },
      {
        type: "normal",
        label: "Quit Falkor",
        click: () => app.quit(),
      },
    ]);
  }

  private showWindow() {
    const win = this.window;
    if (!win) return; // If window doesn't exist, nothing to do

    if (win.isMinimized()) {
      win.restore();
    }
    win.show();
  }

  destroy() {
    if (this.window) {
      this.window.destroy();
      this.window = null;
    }
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  private setupSettings() {
    const maxDownloadSpeed = settings.get("maxDownloadSpeed");
    const maxUploadSpeed = settings.get("maxUploadSpeed");

    if (maxDownloadSpeed > 0) client.throttleDownload(maxDownloadSpeed);
    if (maxUploadSpeed > 0) client.throttleUpload(maxUploadSpeed);
  }

  emitToFrontend = <TData>(channel: string, data?: TData) => {
    if (!this.window) return; // If window doesn't exist, nothing to do
    this.window.webContents.send(channel, data);
  };
}

const window = new Window();

export default window;
