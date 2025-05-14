import type { Video } from "@/@types";
import { cn } from "@/lib";

interface MediaTrailerProps {
	videos: Video[] | undefined;
	className?: string;
}

const MediaTrailer = ({ videos, className }: MediaTrailerProps) => {
	if (!videos?.length) return null;

	return (
		<iframe
			className={cn("aspect-video h-[500px] w-full rounded-lg", className)}
			src={`https://www.youtube.com/embed/${videos?.[0].video_id}`}
			title="YouTube video player"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowFullScreen
		/>
	);
};

export default MediaTrailer;
