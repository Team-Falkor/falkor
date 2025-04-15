import { DownloadStatus } from "@/@types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { useDownloadStats } from "../hooks";

/**
 * Component that displays download statistics
 * Shows active, queued, paused, completed, and failed counts
 * Also shows overall progress and download speed
 */
export function DownloadStats() {
  const {
    activeCount,
    queuedCount,
    pausedCount,
    completedCount,
    failedCount,
    totalCount,
    hasDownloads,
  } = useDownloadStats();

  // Get all downloads to calculate total progress and speed
  const { downloads } = useDownloadsStore();

  // Calculate overall progress percentage
  const calculateOverallProgress = () => {
    if (!hasDownloads) return 0;

    const totalProgress = downloads.reduce((sum, download) => {
      return sum + (download.progress || 0);
    }, 0);

    return totalProgress / totalCount;
  };

  // Calculate total download speed
  const calculateTotalSpeed = () => {
    const totalSpeed = downloads
      .filter((d) => d.status === DownloadStatus.DOWNLOADING)
      .reduce((sum, download) => {
        return sum + (download.speed || 0);
      }, 0);

    return formatBytes(totalSpeed) + "/s";
  };

  if (!hasDownloads) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-5 gap-4 text-center mb-4">
          <div>
            <div className="text-2xl font-bold">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{queuedCount}</div>
            <div className="text-sm text-muted-foreground">Queued</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pausedCount}</div>
            <div className="text-sm text-muted-foreground">Paused</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{completedCount}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{failedCount}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{calculateTotalSpeed()}</span>
            </div>
            <Progress value={calculateOverallProgress() * 100} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Import at the end to avoid circular dependency issues
import { useDownloadsStore } from "@/stores/downloads";
