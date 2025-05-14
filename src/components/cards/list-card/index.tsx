import { Link } from "@tanstack/react-router";
import type { RouterOutputs } from "@/@types";
import PlayStopButton from "@/components/play-stop-button";
import { H5 } from "@/components/ui/typography";
import ListCardImage from "./image";
import { EditGameOverlay } from "./overlay";

type ListCardProps =
	RouterOutputs["lists"]["getByIdWithGames"]["games"][number];

const ListCard = (game: ListCardProps) => {
	const { gameName, gameId, gameIcon: image } = game;

	const imageId = image ? image.replace("t_thumb", "t_cover_big") : "";

	return (
		<div className="group relative flex h-[300px] w-[200px] flex-col overflow-hidden rounded-lg border transition-shadow duration-300 hover:border-border hover:shadow-xl">
			<div className="z-10 self-start p-2">
				<EditGameOverlay game={game} />
			</div>

			<Link
				to={"/info/$id"}
				params={{ id: gameId.toString() }}
				className="flex size-full flex-col"
			>
				{/* IMAGE */}
				<div className="absolute inset-0 z-0 overflow-hidden transition-transform duration-300 group-hover:scale-105">
					<ListCardImage imageId={imageId} alt={gameName} />

					<span className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
				</div>

				{/* CONTENT */}
				<div className="relative z-10 flex h-full flex-col justify-between p-3 px-4">
					<div />
					<div className="flex justify-center">
						<PlayStopButton game={game} />
					</div>
					<H5 className="group-hover:-translate-y-1 line-clamp-2 transform text-pretty transition-all duration-300 group-hover:opacity-100">
						{gameName}
					</H5>
				</div>
			</Link>
		</div>
	);
};

export default ListCard;
