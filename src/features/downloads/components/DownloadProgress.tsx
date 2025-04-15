import { DownloadItem, DownloadStatus } from "@/@types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib";
import { formatBytes } from "@/lib/utils";

interface DownloadProgressProps {
  download: DownloadItem;
}

export function DownloadProgress({ download }: DownloadProgressProps) {
  const isActive = download.status === DownloadStatus.DOWNLOADING;
  const isCompleted = download.status === DownloadStatus.COMPLETED;
  const isPaused = download.status === DownloadStatus.PAUSED;
  const isFailed = download.status === DownloadStatus.FAILED;

  // Format the download speed
  const formatSpeed = (bytesPerSecond: number) => {
    if (!bytesPerSecond || bytesPerSecond === 0) return "";
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  // Format the time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (!seconds || seconds <= 0) return "";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s remaining`;
    } else {
      return `${remainingSeconds}s remaining`;
    }
  };

  // Get the progress color based on status
  const getProgressColor = () => {
    if (isCompleted) return "bg-green-500";
    if (isPaused) return "bg-yellow-500";
    if (isFailed) return "bg-red-500";
    return "bg-primary";
  };

  // Get the status text
  const getStatusText = () => {
    if (isCompleted) return "Completed";
    if (isPaused) return "Paused";
    if (isFailed) return download.error || "Failed";
    if (isActive) {
      return `${formatSpeed(download.speed)} - ${formatTimeRemaining(download.timeRemaining)}`;
    }
    return "Queued";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {download.progress.toFixed(1)}% -{" "}
          {formatBytes(download.size * (download.progress / 100))} of{" "}
          {formatBytes(download.size)}
        </span>
        <span>{getStatusText()}</span>
      </div>
      <Progress
        value={download.progress}
        className={cn("h-2", {
          [getProgressColor()]: true,
        })}
      />
    </div>
  );
}
