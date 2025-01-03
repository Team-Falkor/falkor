import { DownloadData } from "@/@types";
import { ITorrent } from "@/@types/torrent";
import { Button } from "@/components/ui/button";
import { UseDownloadAction } from "@/features/downloads/hooks/useDownloadAction";
import { isTorrent } from "@/lib";
import { Pause, Play } from "lucide-react";
import { MdStop } from "react-icons/md";

interface DownloadCardActionsProps {
  stats: ITorrent | DownloadData;
  deleteStats: (id: string) => void;
  isPaused?: boolean;
}

const DownloadCardActions = ({
  stats,
  deleteStats,
}: DownloadCardActionsProps) => {
  const isTorrentType = isTorrent(stats);

  const { pause, start, stop, status } = UseDownloadAction(
    isTorrentType ? stats.infoHash : stats.id
  );

  if (status === "stopped" || !stats) return null;

  return (
    <div className="flex flex-row gap-4">
      {status === "paused" ? (
        <Button size="default" className="gap-2" onClick={start ?? undefined}>
          <Play className="fill-current" size="24" />
          Start Download
        </Button>
      ) : (
        <Button size="default" className="gap-2" onClick={pause ?? undefined}>
          <Pause fill="currentColor" size="24" />
          Pause Download
        </Button>
      )}

      <Button
        size="icon"
        variant="destructive"
        className="p-0.5"
        onClick={() => {
          stop();
          deleteStats(isTorrentType ? stats.infoHash : stats.id);
        }}
      >
        <MdStop size="25" />
      </Button>
    </div>
  );
};

export default DownloadCardActions;
