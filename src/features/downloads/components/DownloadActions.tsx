import { Button } from "@/components/ui/button";
import { Pause, Play, Trash } from "lucide-react";
import { useDownloadActions, useDownloadStats } from "../hooks";

/**
 * Component that provides global download action buttons
 * (pause all, resume all, clear completed)
 */
export function DownloadActions() {
  const { pauseDownload, resumeDownload, clearCompletedDownloads } =
    useDownloadActions();
  const { activeCount, pausedCount, completedCount } = useDownloadStats();

  // Pause all active downloads
  const handlePauseAll = async () => {
    // Get all active downloads from the store
    const { downloads } = useDownloadsStore.getState();
    const activeDownloads = downloads.filter(
      (d) => d.status === DownloadStatus.DOWNLOADING
    );

    // Pause each active download
    for (const download of activeDownloads) {
      await pauseDownload(download.id);
    }
  };

  // Resume all paused downloads
  const handleResumeAll = async () => {
    // Get all paused downloads from the store
    const { downloads } = useDownloadsStore.getState();
    const pausedDownloads = downloads.filter(
      (d) => d.status === DownloadStatus.PAUSED
    );

    // Resume each paused download
    for (const download of pausedDownloads) {
      await resumeDownload(download.id);
    }
  };

  return (
    <div className="flex space-x-2">
      {activeCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePauseAll}
          className="flex items-center gap-1"
        >
          <Pause className="h-4 w-4" />
          Pause All
        </Button>
      )}

      {pausedCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResumeAll}
          className="flex items-center gap-1"
        >
          <Play className="h-4 w-4" />
          Resume All
        </Button>
      )}

      {completedCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearCompletedDownloads}
          className="flex items-center gap-1"
        >
          <Trash className="h-4 w-4" />
          Clear Completed
        </Button>
      )}
    </div>
  );
}

// Import at the end to avoid circular dependency issues
import { DownloadStatus } from "@/@types";
import { useDownloadsStore } from "@/stores/downloads";
