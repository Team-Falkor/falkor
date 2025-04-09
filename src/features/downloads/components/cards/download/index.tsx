import { DownloadData } from "@/@types";
import { ITorrent } from "@/@types/torrent";
import IGDBImage from "@/components/IGDBImage";
import { useDownloadSpeedHistory } from "@/features/downloads/hooks/useDownloadSpeedHistory";
import { bytesToHumanReadable, cn, isTorrent } from "@/lib";
import { useEffect } from "react";
import DownloadCardActions from "./actions";
import DownloadCardChartArea from "./chartArea";
import DownloadCardStat from "./stat";
import DownloadCardTitle from "./title";

interface DownloadCardProps {
  stats: ITorrent | DownloadData;
  deleteStats: (id: string) => void;
}

const DownloadCard = ({ stats, deleteStats }: DownloadCardProps) => {
  const { speedHistory, updateSpeedHistory, peakSpeed } =
    useDownloadSpeedHistory();
  const { game_data } = stats;

  const torrentMode = isTorrent(stats);
  const downloading = stats.status === "downloading";

  useEffect(() => {
    if (stats.downloadSpeed) updateSpeedHistory(stats.downloadSpeed);
  }, [stats.downloadSpeed, updateSpeedHistory]);

  const statsTexts = {
    downloadSpeedText:
      bytesToHumanReadable(downloading ? (stats.downloadSpeed ?? 0) : 0) + "/s",
    uploadSpeedText:
      bytesToHumanReadable(
        torrentMode && downloading ? (stats.uploadSpeed ?? 0) : 0
      ) + "/s",
    peakSpeedText:
      bytesToHumanReadable(downloading ? (peakSpeed ?? 0) : 0) + "/s",
    totalSizeText: bytesToHumanReadable(stats.totalSize ?? 0),
  };

  const containerClass = cn(
    "w-full flex relative group",
    downloading ? "h-60" : "h-48"
  );

  useEffect(() => {
    console.log({ game_data });
  }, [game_data]);

  return (
    <div className={containerClass}>
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        {game_data?.image_id && (
          <IGDBImage
            imageId={game_data.image_id}
            alt={game_data.name ?? ""}
            className="object-cover w-full h-full relative z-1"
          />
        )}
        <div
          className={cn(
            "absolute inset-0 size-full bg-background opacity-55 z-2",
            {
              "opacity-90 overflow-hidden": !downloading,
            }
          )}
        />
      </div>

      <div className="relative z-10 flex flex-row items-start justify-between p-5 px-10 size-full">
        <div className="flex justify-start items-end h-full w-[65%]">
          <div className="flex flex-col justify-start items-start gap-1.5">
            <DownloadCardTitle title={game_data?.name ?? ""} />
            <div className="relative p-1 overflow-hidden">
              <DownloadCardActions
                stats={stats}
                deleteStats={deleteStats}
                isPaused={stats.status === "paused"}
              />
            </div>
          </div>
        </div>

        {downloading && (
          <div className="flex flex-col items-end justify-between flex-1 h-full gap-4">
            <div className="overflow-hidden size-full">
              <DownloadCardChartArea
                progress={
                  stats.progress
                    ? "infoHash" in stats
                      ? stats.progress * 100
                      : stats.progress
                    : 0
                }
                timeRemaining={stats.timeRemaining ?? 0}
                chartData={speedHistory}
              />
            </div>
            <div className="flex justify-between w-full gap-4">
              <DownloadCardStat
                title="Download"
                text={statsTexts.downloadSpeedText}
              />
              {torrentMode && (
                <DownloadCardStat
                  title="Upload"
                  text={statsTexts.uploadSpeedText}
                />
              )}
              <DownloadCardStat title="Peak" text={statsTexts.peakSpeedText} />
              <DownloadCardStat title="Total" text={statsTexts.totalSizeText} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadCard;
