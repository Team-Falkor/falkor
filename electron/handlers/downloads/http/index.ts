import { HttpDownloadHandler } from "./HttpDownloadHandler";

/**
 * Singleton instance of the HttpDownloadHandler.
 * Import this instance throughout the application to manage downloads.
 *
 * @example
 * import { httpDownloadHandler } from '@/download';
 * httpDownloadHandler.startDownload(item);
 */
export const httpDownloadHandler = new HttpDownloadHandler();
