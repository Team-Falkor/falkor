import { DownloadItem, DownloadStatus } from "@/@types";
import { Button } from "@/components/ui/button";
import { useDownloadsStore } from "@/stores/downloads";
import { Trash } from "lucide-react";
import { useEffect, useMemo } from "react";
import { DownloadTabs } from "./DownloadTabs";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

export function Downloads() {
  const {
    downloads,
    isLoading,
    error,
    fetchDownloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    clearCompletedDownloads,
  } = useDownloadsStore();

  useEffect(() => {
    fetchDownloads();
    const intervalId = setInterval(() => {
      fetchDownloads();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchDownloads]);

  const categorizedDownloads = useMemo(() => {
    const categories = {
      active: [] as DownloadItem[],
      completed: [] as DownloadItem[],
      queued: [] as DownloadItem[],
      failed: [] as DownloadItem[],
      paused: [] as DownloadItem[],
      cancelled: [] as DownloadItem[],
      other: [] as DownloadItem[],
    };
    for (const download of downloads) {
      switch (download.status) {
        case DownloadStatus.DOWNLOADING:
          categories.active.push(download);
          break;
        case DownloadStatus.COMPLETED:
          categories.completed.push(download);
          break;
        case DownloadStatus.QUEUED:
          categories.queued.push(download);
          break;
        case DownloadStatus.FAILED:
          categories.failed.push(download);
          break;
        case DownloadStatus.PAUSED:
          categories.paused.push(download);
          break;
        case DownloadStatus.CANCELLED:
          categories.cancelled.push(download);
          break;
        default:
          categories.other.push(download);
          break;
      }
    }
    return categories;
  }, [downloads]);

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Downloads</h1>
        <Button
          variant="outline"
          onClick={clearCompletedDownloads}
          disabled={categorizedDownloads.completed.length === 0}
        >
          <Trash className="h-4 w-4 mr-2" />
          Clear Completed
        </Button>
      </div>
      {isLoading && downloads.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} retry={fetchDownloads} />
      ) : downloads.length === 0 ? (
        <EmptyState />
      ) : (
        <DownloadTabs
          categorizedDownloads={categorizedDownloads}
          pauseDownload={pauseDownload}
          resumeDownload={resumeDownload}
          cancelDownload={cancelDownload}
          removeDownload={removeDownload}
        />
      )}
    </div>
  );
}
