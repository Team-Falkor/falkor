import { Link } from "@tanstack/react-router";
import type { RouterOutputs } from "@/@types";
import { H5 } from "@/components/ui/typography";
import ListCardImage from "./image";

type ListCardProps =
	RouterOutputs["lists"]["getByIdWithGames"]["games"][number];

const ListCard = ({ gameName, gameId, gameIcon: image }: ListCardProps) => {
	const imageId = image
		? `https:${image.replace("t_thumb", "t_cover_big")}`
		: "";

	return (
		<Link to={"/info/$id"} params={{ id: gameId.toString() }}>
			<div className="group relative flex h-[300px] w-[200px] flex-col overflow-hidden rounded-lg border transition-shadow duration-300 hover:border-border hover:shadow-xl">
				{/* IMAGE */}
				<div className="absolute inset-0 z-0 overflow-hidden transition-transform duration-300 group-hover:scale-105">
					<ListCardImage imageId={imageId} alt={gameName} />

					<span className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
				</div>

				{/* CONTENT */}
				<div className="relative z-10 flex h-full flex-col justify-between p-3 px-4">
					<div />
					<H5 className="group-hover:-translate-y-1 line-clamp-2 transform text-pretty transition-all duration-300 group-hover:opacity-100">
						{gameName}
					</H5>
				</div>
			</div>
		</Link>
	);
};

export default ListCard;
