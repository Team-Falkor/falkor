import { app, BrowserWindow, Menu, nativeImage, screen, Tray } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { settings } from "../utils/settings/settings";
import { client } from "./torrent";
import { existsSync } from "node:fs";

// Resolve directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");

// Define application paths
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

// Set public directory path
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

/**
 * Window configuration options
 */
interface WindowOptions {
  /** Whether to create the tray icon */
  createTray?: boolean;
  /** Whether to show the window on startup */
  showOnStartup?: boolean;
  /** Whether to enable dev tools */
  enableDevTools?: boolean;
}

/**
 * Manages the application window and tray icon
 */
class Window {
  /** The main application window */
  private window: BrowserWindow | null = null;
  /** The system tray icon */
  private tray: Tray | null = null;
  /** Screen dimensions */
  // private _screenWidth: number = 0;
  // private _screenHeight: number = 0;
  /** Whether the window has been initialized */
  private initialized: boolean = false;

  /**
   * Creates and configures the main application window
   * @param options Window configuration options
   * @returns The created BrowserWindow instance
   */
  public createWindow(options: WindowOptions = {}) {
    // Return existing window if already created
    if (this.window) {
      console.log("info", "Window already exists, returning existing instance");
      return this.window;
    }

    try {
      // Get screen dimensions
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      // this._screenWidth = width;
      // this._screenHeight = height;

      // Get window style from settings
      const titleBarStyle = settings.get("titleBarStyle");
      const frame = titleBarStyle === "native" || titleBarStyle === "none";

      // Resolve icon path
      const iconPath = path.join(process.env.VITE_PUBLIC || "", "icon.png");
      const iconExists = existsSync(iconPath);
      
      if (!iconExists) {
        console.log("warn", `Icon not found at path: ${iconPath}`);
      }

      // Create the browser window
      const win = new BrowserWindow({
        icon: iconExists ? iconPath : undefined,
        webPreferences: {
          preload: path.join(__dirname, "preload.mjs"),
          devTools: options.enableDevTools ?? !app.isPackaged,
          contextIsolation: true,
          nodeIntegration: false,
        },
        backgroundColor: "#020817",
        autoHideMenuBar: false,
        minWidth: 1000,
        minHeight: 600,
        frame,
        width: Math.min(width * 0.8, 1000),
        height: Math.min(height * 0.8, 600),
        resizable: true,
        show: options.showOnStartup ?? true,
      });

      // Load the app URL
      const loadURL = VITE_DEV_SERVER_URL || 
        `file://${path.join(RENDERER_DIST, "index.html")}`;
      
      win.loadURL(loadURL).catch(error => {
        console.log("error", `Failed to load URL ${loadURL}: ${error}`);
      });

      // Set up window event handlers
      this.setupWindowEvents(win);
      
      // Apply settings
      this.setupSettings();

      // Initialize tray if needed
      if (options.createTray ?? true) {
        this.createTray();
      }

      this.window = win;
      this.initialized = true;
      console.log("info", "Main window created successfully");
      
      return win;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("error", `Failed to create window: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Creates the system tray icon
   * @private
   */
  private createTray() {
    // Prevent re-creating tray
    if (this.tray) {
      console.log("info", "Tray already exists, skipping creation");
      return;
    }

    try {
      // Resolve tray icon path
      const trayIconPath = path.join(process.env.VITE_PUBLIC || "", "icon.png");
      
      // Verify icon exists
      if (!existsSync(trayIconPath)) {
        console.log("warn", `Tray icon not found at path: ${trayIconPath}`);
        return;
      }

      // Create tray with icon
      const trayImage = nativeImage.createFromPath(trayIconPath);
      const tray = new Tray(trayImage);
      tray.setToolTip("Falkor");

      // Set context menu
      tray.setContextMenu(this.createContextMenu());

      // Set up event handlers
      tray.on("double-click", () => this.showWindow());
      tray.on("click", () => this.showWindow());
      
      this.tray = tray;
      console.log("info", "Tray icon created successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("error", `Failed to create tray: ${errorMessage}`);
    }
  }

  /**
   * Creates the tray context menu
   * @returns The created menu
   * @private
   */
  private createContextMenu() {
    return Menu.buildFromTemplate([
      {
        type: "normal",
        label: "Open Falkor",
        click: () => this.showWindow(),
      },
      { type: "separator" },
      {
        type: "normal",
        label: "Quit Falkor",
        click: () => this.safeQuit(),
      },
    ]);
  }

  /**
   * Shows and focuses the main window
   * @private
   */
  private showWindow() {
    const win = this.window;
    if (!win) {
      console.log("warn", "Cannot show window: window does not exist");
      return;
    }

    try {
      // Restore if minimized
      if (win.isMinimized()) {
        win.restore();
      }
      
      // Show and focus
      win.show();
      win.focus();
      
      console.log("info", "Window shown and focused");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("error", `Failed to show window: ${errorMessage}`);
    }
  }

  /**
   * Safely quits the application
   * @private
   */
  private safeQuit() {
    console.log("info", "Initiating application quit");
    this.destroy().then(() => {
      app.quit();
    }).catch(error => {
      console.log("error", `Error during quit: ${error}`);
      app.exit(1);
    });
  }
  
  /**
   * Sets up event handlers for the window
   * @param win The window to set up events for
   * @private
   */
  private setupWindowEvents(win: BrowserWindow) {
    // Handle window close event
    win.on("close", (event) => {
      // Prevent default close behavior
      event.preventDefault();
      
      // Hide window instead of closing
      if (win && !win.isDestroyed()) {
        win.hide();
        console.log("info", "Window hidden instead of closed");
      }
    });
    
    // Log window events
    win.on("minimize", () => {
      console.log("info", "Window minimized");
    });
    
    win.on("maximize", () => {
      console.log("info", "Window maximized");
    });
    
    win.on("unmaximize", () => {
      console.log("info", "Window unmaximized");
    });
    
    win.on("focus", () => {
      console.log("info", "Window focused");
    });
    
    win.webContents.on("did-fail-load", (_, errorCode, errorDescription) => {
      console.log("error", `Page failed to load: ${errorDescription} (${errorCode})`);
    });
  }
  
  /**
   * Destroys the window and tray, releasing resources
   * @returns Promise that resolves when destruction is complete
   */
  public async destroy(): Promise<void> {
    console.log("info", "Destroying window and resources");
    
    try {
      // Destroy window
      if (this.window && !this.window.isDestroyed()) {
        this.window.removeAllListeners();
        this.window.webContents.removeAllListeners();
        this.window.destroy();
        this.window = null;
      }
      
      // Destroy tray
      if (this.tray) {
        this.tray.destroy();
        this.tray = null;
      }
      
      this.initialized = false;
      console.log("info", "Window and resources destroyed successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("error", `Error destroying window: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Applies settings to the application
   * @private
   */
  private setupSettings() {
    try {
      // Apply torrent speed limits
      const maxDownloadSpeed = settings.get("maxDownloadSpeed");
      const maxUploadSpeed = settings.get("maxUploadSpeed");

      if (maxDownloadSpeed > 0) {
        client.throttleDownload(maxDownloadSpeed);
        console.log("info", `Set download speed limit to ${maxDownloadSpeed}`); 
      }
      
      if (maxUploadSpeed > 0) {
        client.throttleUpload(maxUploadSpeed);
        console.log("info", `Set upload speed limit to ${maxUploadSpeed}`);
      }
      
      // Apply other settings as needed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("error", `Failed to apply settings: ${errorMessage}`);
    }
  }

  /**
   * Sends a message to the frontend
   * @param channel The IPC channel name
   * @param data Optional data to send
   * @returns Whether the message was sent successfully
   */
  public emitToFrontend = <TData>(channel: string, data?: TData): boolean => {
    if (!channel || typeof channel !== "string") {
      console.log("error", "Invalid channel name for IPC communication");
      return false;
    }
    
    if (!this.window || this.window.isDestroyed()) {
      console.log("warn", `Cannot emit to frontend (${channel}): window does not exist or is destroyed`);
      return false;
    }
    
    try {
      this.window.webContents.send(channel, data);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("error", `Failed to emit to frontend (${channel}): ${errorMessage}`);
      return false;
    }
  };
  
  /**
   * Checks if the window is initialized
   * @returns True if the window is initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Gets the current window instance
   * @returns The current window or null if not created
   */
  public getWindow(): BrowserWindow | null {
    return this.window;
  }
}

const window = new Window();

export default window;
