import { DownloadStatus } from "@/@types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash } from "lucide-react";
import {
  useDownloadActions,
  useDownloadEvents,
  useDownloadStats,
} from "../hooks";
import { DownloadItem } from "./DownloadItem";

export function Downloads() {
  // Use our custom hooks
  const { downloads } = useDownloadEvents();
  const {
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    clearCompletedDownloads,
  } = useDownloadActions();
  const {
    activeCount,
    pausedCount,
    completedCount,
    failedCount,
    hasDownloads,
  } = useDownloadStats();

  // Filter downloads by status
  const activeDownloads = downloads.filter(
    (d) =>
      d.status === DownloadStatus.DOWNLOADING ||
      d.status === DownloadStatus.QUEUED
  );
  const pausedDownloads = downloads.filter(
    (d) => d.status === DownloadStatus.PAUSED
  );
  const completedDownloads = downloads.filter(
    (d) => d.status === DownloadStatus.COMPLETED
  );
  const failedDownloads = downloads.filter(
    (d) => d.status === DownloadStatus.FAILED
  );

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Downloads</h1>
        {hasDownloads && completedCount > 0 && (
          <Button
            variant="outline"
            onClick={() => clearCompletedDownloads()}
            className="flex items-center gap-2"
          >
            <Trash className="h-4 w-4" />
            Clear Completed
          </Button>
        )}
      </div>

      {!hasDownloads ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No downloads in queue. Start a download to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({pausedCount})</TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCount})
            </TabsTrigger>
            <TabsTrigger value="failed">Failed ({failedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeDownloads.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No active downloads.</p>
                </CardContent>
              </Card>
            ) : (
              activeDownloads.map((download) => (
                <DownloadItem
                  key={download.id}
                  download={download}
                  onPause={pauseDownload}
                  onResume={resumeDownload}
                  onCancel={cancelDownload}
                  onRemove={removeDownload}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="paused">
            {pausedDownloads.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No paused downloads.</p>
                </CardContent>
              </Card>
            ) : (
              pausedDownloads.map((download) => (
                <DownloadItem
                  key={download.id}
                  download={download}
                  onPause={pauseDownload}
                  onResume={resumeDownload}
                  onCancel={cancelDownload}
                  onRemove={removeDownload}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedDownloads.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    No completed downloads.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedDownloads.map((download) => (
                <DownloadItem
                  key={download.id}
                  download={download}
                  onPause={pauseDownload}
                  onResume={resumeDownload}
                  onCancel={cancelDownload}
                  onRemove={removeDownload}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="failed">
            {failedDownloads.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No failed downloads.</p>
                </CardContent>
              </Card>
            ) : (
              failedDownloads.map((download) => (
                <DownloadItem
                  key={download.id}
                  download={download}
                  onPause={pauseDownload}
                  onResume={resumeDownload}
                  onCancel={cancelDownload}
                  onRemove={removeDownload}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
