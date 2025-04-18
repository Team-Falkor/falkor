/**
 * Module for persisting download queue state between app restarts
 */

import { DownloadItem } from "@/@types";
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { downloadQueue } from ".";
import { constants } from "../../../utils/constants";
import { settings } from "../../../utils/settings/settings";

// File path for persisting queue state
const QUEUE_STATE_FILE = path.join(
  app.getPath("userData"),
  "download-queue-state.json"
);

/**
 * Save the current state of the download queue to disk
 */
export async function saveQueueState(): Promise<void> {
  try {
    // Get all downloads
    const downloads = downloadQueue.getDownloads();

    // Filter out completed downloads if configured to do so
    const persistCompleted = settings.get("persistCompletedDownloads") ?? false;
    const downloadsToSave = persistCompleted
      ? downloads
      : downloads.filter((d) => d.status !== "completed");

    // Convert Date objects to strings for serialization
    const serializedDownloads = downloadsToSave.map((download) => ({
      ...download,
      created: download.created.toISOString(),
      started: download.started ? download.started.toISOString() : undefined,
      completed: download.completed
        ? download.completed.toISOString()
        : undefined,
    }));

    // Write to file
    await fs.promises.writeFile(
      QUEUE_STATE_FILE,
      JSON.stringify({ downloads: serializedDownloads }, null, 2)
    );

    console.log(`Download queue state saved (${downloadsToSave.length} items)`);
  } catch (error) {
    console.error("Error saving download queue state:", error);
  }
}

/**
 * Load the saved state of the download queue from disk
 * @returns Array of download items or undefined if no saved state
 */
export async function loadQueueState(): Promise<DownloadItem[] | undefined> {
  try {
    // Check if state file exists
    await fs.promises.access(QUEUE_STATE_FILE, fs.constants.F_OK);

    // Read and parse file
    const data = await fs.promises.readFile(QUEUE_STATE_FILE, "utf-8");
    const parsed = JSON.parse(data);

    if (!parsed.downloads || !Array.isArray(parsed.downloads)) {
      return undefined;
    }

    // Convert string dates back to Date objects
    const downloads: DownloadItem[] = parsed.downloads.map((download: any) => ({
      ...download,
      created: new Date(download.created),
      started: download.started ? new Date(download.started) : undefined,
      completed: download.completed ? new Date(download.completed) : undefined,
    }));

    console.log(`Download queue state loaded (${downloads.length} items)`);
    return downloads;
  } catch (error) {
    // File doesn't exist or other error
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.log("No saved download queue state found");
    } else {
      console.error("Error loading download queue state:", error);
    }
    return undefined;
  }
}

/**
 * Restore the download queue from saved state
 */
export async function restoreQueueState(): Promise<void> {
  const downloads = await loadQueueState();

  if (!downloads || downloads.length === 0) {
    return;
  }

  // Check if downloads path still exists, use default if not
  const checkPath = async (path: string): Promise<string> => {
    try {
      await fs.promises.access(path, fs.constants.F_OK);
      return path;
    } catch {
      return settings.get("downloadsPath") ?? constants.downloadsPath;
    }
  };

  // Add each download back to the queue
  for (const download of downloads) {
    // Verify the download path still exists
    download.path = await checkPath(download.path);

    // Add to queue but don't auto-start
    await downloadQueue.addDownload({
      url: download.url,
      type: download.type,
      name: download.name,
      path: download.path,
      game_data: download.game_data,
      autoStart: false,
    });
  }
}

/**
 * Initialize persistence by setting up auto-save and loading saved state
 */
export async function initializePersistence(): Promise<void> {
  // Set up auto-save interval (every 30 seconds)
  setInterval(saveQueueState, 30000);

  // Save state on app quit
  app.on("will-quit", async () => {
    await saveQueueState();
  });

  // Load saved state
  await restoreQueueState();
}
