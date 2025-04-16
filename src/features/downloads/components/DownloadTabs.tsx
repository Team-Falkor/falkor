import { DownloadItem as DownloadItemType } from "@/@types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadItem } from "./DownloadItem";

interface DownloadTabsProps {
  categorizedDownloads: {
    active: DownloadItemType[];
    completed: DownloadItemType[];
    queued: DownloadItemType[];
    failed: DownloadItemType[];
    paused: DownloadItemType[];
    cancelled: DownloadItemType[];
    other: DownloadItemType[];
  };
  pauseDownload: (id: string) => Promise<boolean>;
  resumeDownload: (id: string) => Promise<boolean>;
  cancelDownload: (id: string) => Promise<boolean>;
  removeDownload: (id: string) => Promise<boolean>;
}

interface RenderEmptyTabProps {
  text: string;
}

function RenderEmptyTab({ text }: RenderEmptyTabProps) {
  return <p className="text-left w-full text-muted-foreground py-12">{text}</p>;
}

export function DownloadTabs({
  categorizedDownloads,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  removeDownload,
}: DownloadTabsProps) {
  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="mb-4 grid grid-cols-2 sm:grid-cols-4 h-auto">
        <TabsTrigger value="active">
          Active (
          {categorizedDownloads.active.length +
            categorizedDownloads.paused.length}
          )
        </TabsTrigger>
        <TabsTrigger value="queued">
          Queued ({categorizedDownloads.queued.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({categorizedDownloads.completed.length})
        </TabsTrigger>
        <TabsTrigger value="failed">
          Failed ({categorizedDownloads.failed.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="active"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
      >
        {[...categorizedDownloads.active, ...categorizedDownloads.paused]
          .length > 0 ? (
          [...categorizedDownloads.active, ...categorizedDownloads.paused].map(
            (download) => (
              <DownloadItem
                key={download.id}
                download={download}
                pauseDownload={pauseDownload}
                resumeDownload={resumeDownload}
                cancelDownload={cancelDownload}
                removeDownload={removeDownload}
              />
            )
          )
        ) : (
          <RenderEmptyTab text="No active downloads" />
        )}
      </TabsContent>
      <TabsContent
        value="queued"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
      >
        {categorizedDownloads.queued.length > 0 ? (
          categorizedDownloads.queued.map((download) => (
            <DownloadItem
              key={download.id}
              download={download}
              pauseDownload={pauseDownload}
              resumeDownload={resumeDownload}
              cancelDownload={cancelDownload}
              removeDownload={removeDownload}
            />
          ))
        ) : (
          <RenderEmptyTab text="No queued downloads" />
        )}
      </TabsContent>
      <TabsContent
        value="completed"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
      >
        {categorizedDownloads.completed.length > 0 ? (
          categorizedDownloads.completed.map((download) => (
            <DownloadItem
              key={download.id}
              download={download}
              pauseDownload={pauseDownload}
              resumeDownload={resumeDownload}
              cancelDownload={cancelDownload}
              removeDownload={removeDownload}
            />
          ))
        ) : (
          <RenderEmptyTab text="No completed downloads" />
        )}
      </TabsContent>
      <TabsContent
        value="failed"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
      >
        {categorizedDownloads.failed.length > 0 ? (
          categorizedDownloads.failed.map((download) => (
            <DownloadItem
              key={download.id}
              download={download}
              pauseDownload={pauseDownload}
              resumeDownload={resumeDownload}
              cancelDownload={cancelDownload}
              removeDownload={removeDownload}
            />
          ))
        ) : (
          <RenderEmptyTab text="No failed downloads" />
        )}
      </TabsContent>
    </Tabs>
  );
}
