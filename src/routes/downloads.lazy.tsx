import { DownloadItem, DownloadStatus } from "@/@types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes } from "@/lib/utils"; // Assuming this utility exists
import { useDownloadsStore } from "@/stores/downloads";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  CheckCircle,
  Clock,
  Loader2,
  Pause,
  Play,
  Trash,
  X,
} from "lucide-react";
import { useEffect, useMemo } from "react";

export const Route = createLazyFileRoute("/downloads")({
  component: Downloads,
});

// Helper function (ensure it handles edge cases)
function formatTimeRemaining(seconds: number | null | undefined): string {
  // Handle null, undefined, or non-positive values gracefully
  if (seconds == null || seconds <= 0) return "--";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // Always show seconds if less than a minute or if it's the only unit
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  // Return "--" if calculation somehow results in zero seconds (shouldn't happen with check above, but safe)
  if (parts.length === 0) return "--";

  return `${parts.join(" ")} remaining`;
}

function Downloads() {
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
    // Initial fetch
    fetchDownloads();

    // Set up interval for periodic fetching
    const intervalId = setInterval(() => {
      fetchDownloads();
    }, 5000); // Refresh every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchDownloads]); // Dependency array ensures effect runs only when fetchDownloads changes (usually stable)

  // Memoize categorized downloads to prevent recalculation on every render
  const categorizedDownloads = useMemo(() => {
    const categories: {
      [x: string]: DownloadItem[];
    } = {
      active: [],
      completed: [],
      queued: [],
      failed: [],
      paused: [],
      cancelled: [],
      other: [], // Catch any unexpected statuses
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
          break; // Handle unknown statuses
      }
    }
    return categories;
  }, [downloads]); // Recalculate only when the downloads array changes

  // Renders a single download item card
  const renderDownloadItem = (download: any) => {
    const isActive = download.status === DownloadStatus.DOWNLOADING;
    const isCompleted = download.status === DownloadStatus.COMPLETED;
    const isPaused = download.status === DownloadStatus.PAUSED;
    const isFailed = download.status === DownloadStatus.FAILED;
    const isCancelled = download.status === DownloadStatus.CANCELLED; // Added for clarity

    const progressValue =
      typeof download.progress === "number" &&
      download.progress >= 0 &&
      download.progress <= 100
        ? download.progress
        : 0;

    return (
      // Key is crucial for React list updates
      // Removed mb-4 as grid gap handles spacing now
      <Card key={download.id}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-2 justify-between items-start">
            {" "}
            {/* Use items-start for better alignment if title wraps */}
            {/* Added break-words for better wrapping on narrow cards */}
            <CardTitle className="text-lg break-words mr-2">
              {download.name || "Untitled Download"}
            </CardTitle>
            {/* Actions group */}
            <div className="flex space-x-1 flex-shrink-0">
              {" "}
              {/* Reduced space-x slightly */}
              {isActive && (
                <Button
                  variant="ghost"
                  size="icon" // Use icon size for compactness
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
              {/* Show cancel only if active, paused, or queued */}
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
              {/* Allow removing completed, failed, or cancelled downloads */}
              {(isCompleted || isFailed || isCancelled) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDownload(download.id)}
                  aria-label="Remove download from list"
                  className="text-destructive hover:text-destructive" // Make trash icon red
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {/* Description - consider adding source URL if available */}
          <CardDescription>
            {download.type === "http"
              ? "HTTP"
              : download.type?.toUpperCase() || "Download"}{" "}
            • {formatBytes(download.size || 0)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Progress Bar */}
            {/* Conditionally render progress bar only if not completed/failed/cancelled */}
            {!isCompleted && !isFailed && !isCancelled && (
              <Progress value={progressValue} className="h-2" />
            )}
            {/* Show simpler status text for completed/failed/cancelled */}
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

            {/* Status Line - Show only for active/paused/queued */}
            {(isActive ||
              isPaused ||
              download.status === DownloadStatus.QUEUED) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between text-xs text-muted-foreground">
                {" "}
                {/* Allow wrapping */}
                {/* Left side: Status/Speed */}
                <div className="flex items-center gap-1">
                  {isActive && (
                    <>
                      <ArrowDownToLine className="h-3 w-3 text-blue-500" />{" "}
                      {/* Added color */}
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
                {/* Right side: Time Remaining */}
                <div className="flex items-center gap-1">
                  {isActive &&
                    download.timeRemaining != null &&
                    download.timeRemaining > 0 && (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTimeRemaining(download.timeRemaining)}
                        </span>
                      </>
                    )}
                  {/* Optionally show completed time if available */}
                  {/* {isCompleted && download.completedAt && (
                      <span className="text-xs">Completed on {new Date(download.completedAt).toLocaleString()}</span>
                  )} */}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  /* Helper for empty tab content */
  const renderEmptyTab = (text: string) => (
    <p className="text-left w-full text-muted-foreground py-12">{text}</p>
  );

  // Main component return
  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Downloads</h1>
        <Button
          variant="outline"
          onClick={clearCompletedDownloads}
          disabled={categorizedDownloads.completed.length === 0} // Use categorized list
        >
          <Trash className="h-4 w-4 mr-2" /> {/* Icon for clarity */}
          Clear Completed
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && downloads.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading downloads...</span>
        </div>
      ) : error ? (
        // Improved Error Display
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button
              onClick={fetchDownloads}
              variant="destructive"
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : downloads.length === 0 ? (
        // Empty State
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-64 py-10 text-center">
            <ArrowDownToLine className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">No Downloads Yet</p>
            <p className="text-muted-foreground">
              Downloads you start will appear here.
            </p>
            {/* Optional: Add a button to guide users if applicable */}
            {/* <Button className="mt-4">Start a Download</Button> */}
          </CardContent>
        </Card>
      ) : (
        // Main Content Tabs
        // Use w-full if Tabs should span the container width
        // Tabs component usually handles responsiveness well itself
        <Tabs defaultValue="active" className="w-full">
          {/* Tabs List */}
          <TabsList className="mb-4 grid grid-cols-2 sm:grid-cols-4 h-auto">
            {" "}
            {/* Make tabs list wrap/grid for smaller viewports */}
            <TabsTrigger value="active">
              Active ({categorizedDownloads.active.length})
            </TabsTrigger>
            <TabsTrigger value="queued">
              Queued ({categorizedDownloads.queued.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({categorizedDownloads.completed.length})
            </TabsTrigger>
            {/* Consider adding Failed/Paused tabs if useful */}
            <TabsTrigger value="failed">
              Failed ({categorizedDownloads.failed.length})
            </TabsTrigger>
            {/* <TabsTrigger value="all">All ({downloads.length})</TabsTrigger> */}
          </TabsList>

          {/* Grid Layout for Download Items within Tabs */}
          {/* Adjust grid columns based on screen size */}
          {/* Added pt-4 for spacing below the tabs list */}
          <TabsContent
            value="active"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
          >
            {categorizedDownloads.active.length > 0
              ? categorizedDownloads.active.map(renderDownloadItem)
              : renderEmptyTab("No active downloads")}
          </TabsContent>

          <TabsContent
            value="queued"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
          >
            {categorizedDownloads.queued.length > 0
              ? categorizedDownloads.queued.map(renderDownloadItem)
              : renderEmptyTab("No queued downloads")}
          </TabsContent>

          <TabsContent
            value="completed"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
          >
            {categorizedDownloads.completed.length > 0
              ? categorizedDownloads.completed.map(renderDownloadItem)
              : renderEmptyTab("No completed downloads")}
          </TabsContent>

          <TabsContent
            value="failed"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4"
          >
            {categorizedDownloads.failed.length > 0
              ? categorizedDownloads.failed.map(renderDownloadItem)
              : renderEmptyTab("No failed downloads")}
          </TabsContent>

          {/* Example for 'All' tab if you keep it */}
          {/* <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
             {downloads.length > 0
              ? downloads.map(renderDownloadItem)
              : renderEmptyTab("No downloads found")}
          </TabsContent> */}
        </Tabs>
      )}
    </div>
  );
}
