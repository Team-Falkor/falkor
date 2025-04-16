import { DownloadItem as DownloadItemType, DownloadStatus } from "@/@types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import {
  ArrowDownToLine,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Trash,
  X,
} from "lucide-react";

interface DownloadItemProps {
  download: DownloadItemType;
  pauseDownload: (id: string) => Promise<boolean>;
  resumeDownload: (id: string) => Promise<boolean>;
  cancelDownload: (id: string) => Promise<boolean>;
  removeDownload: (id: string) => Promise<boolean>;
}

function formatTimeRemaining(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "--";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  if (parts.length === 0) return "--";
  return `${parts.join(" ")} remaining`;
}

export function DownloadItem({
  download,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  removeDownload,
}: DownloadItemProps) {
  const isActive = download.status === DownloadStatus.DOWNLOADING;
  const isCompleted = download.status === DownloadStatus.COMPLETED;
  const isPaused = download.status === DownloadStatus.PAUSED;
  const isFailed = download.status === DownloadStatus.FAILED;
  const isCancelled = download.status === DownloadStatus.CANCELLED;
  const progressValue =
    typeof download.progress === "number" &&
    download.progress >= 0 &&
    download.progress <= 100
      ? download.progress
      : 0;

  return (
    <Card key={download.id}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2 justify-between items-start">
          <CardTitle className="text-lg break-words mr-2">
            {download.name || "Untitled Download"}
          </CardTitle>
          <div className="flex space-x-1 flex-shrink-0">
            {isActive && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => pauseDownload(download.id)}
                aria-label="Pause download"
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {isPaused && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resumeDownload(download.id)}
                aria-label="Resume download"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {(isActive ||
              isPaused ||
              download.status === DownloadStatus.QUEUED) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cancelDownload(download.id)}
                aria-label="Cancel download"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {(isCompleted || isFailed || isCancelled) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeDownload(download.id)}
                aria-label="Remove download from list"
                className="text-destructive hover:text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {download.type === "http"
            ? "HTTP"
            : download.type?.toUpperCase() || "Download"}{" "}
          • {formatBytes(download.size || 0)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {!isCompleted && !isFailed && !isCancelled && (
            <Progress value={progressValue} className="h-2" />
          )}
          {isCompleted && (
            <p className="text-sm text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" /> Completed
            </p>
          )}
          {isFailed && (
            <p className="text-sm text-red-600">
              Failed: {download.error || "Unknown error"}
            </p>
          )}
          {isCancelled && (
            <p className="text-sm text-muted-foreground">Cancelled</p>
          )}
          {(isActive ||
            isPaused ||
            download.status === DownloadStatus.QUEUED) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {isActive && (
                  <>
                    <ArrowDownToLine className="h-3 w-3 text-blue-500" />
                    <span>{formatBytes(download.speed || 0)}/s</span>
                  </>
                )}
                {isPaused && (
                  <span className="text-yellow-600 font-medium">Paused</span>
                )}
                {download.status === DownloadStatus.QUEUED && (
                  <span className="font-medium">Queued</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isActive &&
                  download.timeRemaining != null &&
                  download.timeRemaining > 0 && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeRemaining(download.timeRemaining)}</span>
                    </>
                  )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
