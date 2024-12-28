import { QueueData } from "@/@types";
import IGDBImage from "@/components/IGDBImage";
import { cn } from "@/lib";
import DownloadCardTitle from "../download/title";

interface DownloadQueuedCardProps {
  stats: QueueData;
}

const DownloadQueuedCard = ({ stats }: DownloadQueuedCardProps) => {
  const { game_data } = stats.data;

  return (
    <div className={cn("w-full h-48 flex relative group")}>
      {/* Background */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <IGDBImage
          imageId={game_data?.image_id ?? ""}
          alt={game_data?.name ?? ""}
          className="object-cover w-full h-full relative z-[1]"
        />
        <div
          className={cn(
            "absolute inset-0 size-full bg-background  z-[2] opacity-90 overflow-hidde"
          )}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-row items-start justify-between p-5 px-10 size-full">
        {/* Game Name and Actions */}
        <div className="flex justify-start items-end h-full w-[65%]">
          <div className="flex flex-col justify-start items-start gap-1.5">
            <DownloadCardTitle title={game_data?.name ?? ""} />
            <div className="relative p-1 overflow-hidden"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadQueuedCard;
