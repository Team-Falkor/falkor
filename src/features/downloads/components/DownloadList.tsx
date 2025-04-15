import { DownloadStatus } from "@/@types";
import { useDownloadActions, useDownloadEvents } from "../hooks";
import { DownloadItem } from "./DownloadItem";

interface DownloadListProps {
  status?: DownloadStatus | DownloadStatus[];
  limit?: number;
  showEmpty?: boolean;
  emptyMessage?: string;
}

/**
 * Component that displays a filtered list of downloads
 * Can be filtered by status and limited to a certain number
 */
export function DownloadList({
  status,
  limit,
  showEmpty = true,
  emptyMessage = "No downloads found",
}: DownloadListProps) {
  // Get downloads and actions from hooks
  const { downloads } = useDownloadEvents();
  const { pauseDownload, resumeDownload, cancelDownload, removeDownload } =
    useDownloadActions();

  // Filter downloads by status if provided
  const filteredDownloads = status
    ? Array.isArray(status)
      ? downloads.filter((d) => status.includes(d.status))
      : downloads.filter((d) => d.status === status)
    : downloads;

  // Apply limit if provided
  const displayedDownloads = limit
    ? filteredDownloads.slice(0, limit)
    : filteredDownloads;

  // If no downloads and showEmpty is false, return null
  if (displayedDownloads.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <div className="space-y-4">
      {displayedDownloads.length > 0 ? (
        displayedDownloads.map((download) => (
          <DownloadItem
            key={download.id}
            download={download}
            onPause={pauseDownload}
            onResume={resumeDownload}
            onCancel={cancelDownload}
            onRemove={removeDownload}
          />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
