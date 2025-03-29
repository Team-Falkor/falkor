import { DownloadData, QueueData } from "@/@types";
import { ITorrent } from "@/@types/torrent";
import FolderButton from "@/components/folderButton";
import { H4 } from "@/components/typography/h4";
import { useLanguageContext } from "@/contexts/I18N";
import DownloadCard from "@/features/downloads/components/cards/download";
import { DownloadCardLoading } from "@/features/downloads/components/cards/loading";
import DownloadQueuedCard from "@/features/downloads/components/cards/queued";
import UseDownloads from "@/features/downloads/hooks/useDownloads";
import { useMapState } from "@/hooks";
import { isTorrent } from "@/lib";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";

export const Route = createLazyFileRoute("/downloads")({
  component: Downloads,
});

function Downloads() {
  const { t } = useLanguageContext();
  const { downloads, queue } = UseDownloads();
  const {
    map: statsMap,
    set: setStats,
    remove: removeStats,
  } = useMapState<string, ITorrent | DownloadData>();

  useEffect(() => {
    downloads.forEach(download => {
      const key = isTorrent(download) ? download.infoHash : download.id;
      setStats(key, download);
    });
  }, [downloads, setStats]);



  const getDownloadKey = useCallback((item: ITorrent | DownloadData | QueueData): string => {
    if ("type" in item) {
      return item.type === "torrent" ? item.data.torrentId : item.data.id;
    }
    return isTorrent(item) ? item.infoHash : item.id;
  }, []);

  const uniqueDownloads = useMemo(() => {
    const uniqueSet = new Map<string, ITorrent | DownloadData | QueueData>();
    [...downloads, ...queue].forEach(item => {
      uniqueSet.set(getDownloadKey(item), item);
    });
    return Array.from(uniqueSet.values());
  }, [downloads, queue, getDownloadKey]);

  const renderDownloadCard = useCallback(
    (item: ITorrent | DownloadData | QueueData) => {
      const stats = "type" in item ? item : statsMap.get(getDownloadKey(item));

      if (!stats) return null;

      if ("type" in stats) {
        return (
          <DownloadQueuedCard
            key={getDownloadKey(stats)}
            stats={stats}
          />
        );
      }

      if (stats.status === "pending") {
        return <DownloadCardLoading key={getDownloadKey(item)} />;
      }

      return (
        <DownloadCard
          key={getDownloadKey(stats)}
          stats={stats}
          deleteStats={removeStats}
        />
      );
    },
    [removeStats, statsMap]
  );

  return (
    <div className="flex flex-col w-full h-full  rounded-lg shadow-lg">
      {/* Header */}
      <div className="w-full flex justify-between items-center border-b border-border/40 px-6 py-4 bg-background/95">
        <div className="flex items-center gap-3">
          <H4 className="text-foreground font-semibold">{t("sections.downloads")}</H4>
          {!!uniqueDownloads?.length && <span className="text-muted-foreground text-sm">
            {uniqueDownloads.length} {t("items")}
          </span>}
        </div>

        <div className="flex items-center gap-3">
    
          <FolderButton 
            path="downloads" 
            tooltip={t("open_downloads_folder")} 
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {uniqueDownloads.length ? (
          <div className="grid gap-4 auto-rows-max">
            {uniqueDownloads.map(renderDownloadCard)}
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
