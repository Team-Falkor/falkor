import { DownloadData, QueueData, QueueDataTorrent } from "@/@types";
import { ITorrent } from "@/@types/torrent";
import FolderButton from "@/components/folderButton";
import { H4 } from "@/components/typography/h4";
import { useLanguageContext } from "@/contexts/I18N";
import DownloadCard from "@/features/downloads/components/cards/download";
import { DownloadCardLoading } from "@/features/downloads/components/cards/loading";
import DownloadQueuedCard from "@/features/downloads/components/cards/queued";
import { useDownloadStore } from "@/stores/downloads";
import { isTorrent } from "@/lib/typeGuards";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";

export const Route = createLazyFileRoute("/downloads")({ component: Downloads });

/**
 * Downloads page component that displays all downloads and queued items
 */
function Downloads() {
  const { t } = useLanguageContext();
  
  // Get data directly from the store
  const { 
    downloads, 
    queue, 
    fetchDownloads, 
    fetchQueue, 
    addToQueue: addDownload 
  } = useDownloadStore();

  /**
   * Generates a unique key for any download or queue item
   */
  const getItemKey = useCallback((item: ITorrent | DownloadData | QueueData): string => {
    // For queue items
    if ("type" in item) {
      return item.type === "torrent" ? item.data.torrentId : item.data.id;
    }
    // For download items
    return isTorrent(item) ? item.infoHash : item.id;
  }, []);

  /**
   * Combines downloads and queue items, ensuring no duplicates
   * Queue items are overridden by download items with the same key
   */
  const allItems = useMemo(() => {
    const uniqueItems = new Map<string, ITorrent | DownloadData | QueueData>();
    
    // Add queue items first
    queue.forEach(item => uniqueItems.set(getItemKey(item), item));
    
    // Then add downloads (will override queue items with same key)
    // Filter out stopped downloads
    downloads
      .filter(item => item.status !== "stopped")
      .forEach(item => uniqueItems.set(getItemKey(item), item));
    
    return Array.from(uniqueItems.values());
  }, [downloads, queue, getItemKey]);

  /**
   * Handles adding a test torrent for development purposes
   */
  const handleTestTorrent = useCallback(async () => {
    const testTorrent: QueueDataTorrent = {
      type: "torrent",  
      data: {
        torrentId: "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10",
        game_data: {
          id: 0,
          name: "Test Game",
          image_id: "sc81fn"
        }
      }
    };
    await addDownload(testTorrent);
    // Refresh data after adding
    await Promise.all([fetchDownloads(), fetchQueue()]);
  }, [addDownload, fetchDownloads, fetchQueue]);

  /**
   * Renders the appropriate card component based on item type and status
   */
  const renderItem = useCallback((item: ITorrent | DownloadData | QueueData) => {
    // Queue items
    if ("type" in item) {
      return <DownloadQueuedCard key={getItemKey(item)} stats={item} />;
    }
    
    // Pending downloads
    if (item.status === "pending") {
      return <DownloadCardLoading key={getItemKey(item)} />;
    }
    
    // Active downloads
    return (
      <DownloadCard
        key={getItemKey(item)}
        stats={item}
        deleteStats={() => {
          fetchDownloads();
        }}
      />
    );
  }, [getItemKey, fetchDownloads]);

  return (
    <div className="flex flex-col w-full h-full rounded-lg shadow-lg">
      {/* Header */}
      <div className="w-full flex justify-between items-center bg-background/95 px-6 py-4">
        <div className="flex items-center gap-3">
          <H4 className="text-foreground font-semibold">{t("sections.downloads")}</H4>
          <span className="text-muted-foreground text-sm">
            {allItems.length} {t("items")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestTorrent}
            className="hover:bg-accent"
          >
            {t("test_torrent")}
          </Button>
          <FolderButton 
            path="downloads" 
            tooltip={t("open_downloads_folder")} 
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {allItems.length > 0 ? (
          <div className="grid gap-4 auto-rows-max">
            {allItems.map(renderItem)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center">
            <div className="rounded-full bg-muted/30 p-4 mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <H4 className="text-muted-foreground font-medium mb-2">
              {t("no_downloads_in_progress")}
            </H4>
            <p className="text-sm text-muted-foreground/80">
              {t("start_download_message")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Downloads;
