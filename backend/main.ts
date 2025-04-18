import { app, BrowserWindow, net, protocol } from "electron";
import path from "node:path";
import url from "node:url";
import { torrentDownloadHandler } from "./handlers";
import window from "./utils/window";

// Constants
const DEEP_LINK_NAME = "falkor";
const LOAD_BACKEND_TIMEOUT = 1000;
const RETRY_INTERVAL = 600;

// Configure deep linking
const configureDeepLinking = () => {
  if (process.defaultApp) {
    if (process.argv.length <= 2) {
      app.setAsDefaultProtocolClient(DEEP_LINK_NAME, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(DEEP_LINK_NAME);
  }
};

// Handle second instance
const handleSecondInstance = (commandLine: string[]) => {
  const mainWindow = window.getWindow();
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    const url = commandLine.pop()?.slice(0);

    mainWindow.webContents.send("app:deep-link", url);
  }
};

// Wait until the main window is ready
const waitForWindow = async (): Promise<BrowserWindow | null> => {
  const w = window.getWindow();
  while (!w) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
  }
  return w;
};

// Initialize the app
const initializeApp = async () => {
  await import("./handlers/events");

  window.createWindow();

  protocol.handle("local", (request) => {
    const filePath = request.url.slice("local:".length);
    return net.fetch(url.pathToFileURL(decodeURI(filePath)).toString());
  });

  const mainWindow = await waitForWindow();
  if (mainWindow) {
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        mainWindow.webContents.send("app:backend-loaded");
      }, LOAD_BACKEND_TIMEOUT);
    });
  }
};

// Event Listeners
const setEventListeners = () => {
  app.on("second-instance", (_event, commandLine) => {
    handleSecondInstance(commandLine);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      if (window.destroy) window.destroy();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      window.createWindow();
    }
  });

  app.on("will-quit", () => {
    torrentDownloadHandler.destroy();
  });
};

const gotTheLock = app.requestSingleInstanceLock();

// Main Process
const main = () => {
  configureDeepLinking();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.whenReady().then(initializeApp);
  setEventListeners();
};

main();
