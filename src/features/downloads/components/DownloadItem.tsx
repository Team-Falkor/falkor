import { DownloadItem as DownloadItemType, DownloadStatus } from "@/@types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { Pause, Play, Trash, X } from "lucide-react";
import { DownloadProgress } from "./DownloadProgress";

interface DownloadItemProps {
  download: DownloadItemType;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}

export function DownloadItem({
  download,
  onPause,
  onResume,
  onCancel,
  onRemove,
}: DownloadItemProps) {
  const isActive = download.status === DownloadStatus.DOWNLOADING;
  const isCompleted = download.status === DownloadStatus.COMPLETED;
  const isPaused = download.status === DownloadStatus.PAUSED;
  const isQueued = download.status === DownloadStatus.QUEUED;
  // const isFailed = download.status === DownloadStatus.FAILED;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{download.name}</CardTitle>
          <div className="flex space-x-2">
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPause(download.id)}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {(isPaused || isQueued) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResume(download.id)}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {!isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(download.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(download.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {download.type === "http" ? "HTTP Download" : "Torrent"} •{" "}
          {formatBytes(download.size || 0)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DownloadProgress download={download} />
      </CardContent>
    </Card>
  );
}
