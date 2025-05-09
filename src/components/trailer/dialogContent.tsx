import type { IGDBReturnDataType } from "@/@types";
import MediaTrailer from "../info/media/trailer";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

type Props = Pick<IGDBReturnDataType, "name" | "videos">;

const TrailerDialogContent = ({ name, videos }: Props) => {
	return (
		<DialogContent className="mx-auto min-w-[70svw] overflow-hidden p-4">
			<DialogHeader>
				<DialogTitle className="line-clamp-2 text-lg">{name}</DialogTitle>
			</DialogHeader>
			<div className="relative aspect-video w-full rounded-md">
				<MediaTrailer videos={videos} className="h-full w-full" />
			</div>
		</DialogContent>
	);
};

export default TrailerDialogContent;
