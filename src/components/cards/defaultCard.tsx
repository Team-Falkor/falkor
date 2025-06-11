import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import IGDBImage from "../IGDBImage";
import { Badge } from "../ui/badge";
import { H5 } from "../ui/typography";

type Cover = {
	image: string | undefined;
	type: "image" | "image_id";
};

type DefaultCardProps = {
	cover: Cover;
	name: string;
	id: number;
	total_rating?: number;
	aggregated_rating?: number;

	renderBadge?: (id: number) => React.ReactNode;
	renderTitle?: (id: number, name: string) => React.ReactNode;
	renderActionButton?: (id: number) => React.ReactNode;
	renderBottomOfImage?: (id: number) => React.ReactNode;
};

const DefaultCard = ({
	cover,
	name,
	id,
	total_rating,
	aggregated_rating,

	renderActionButton,
	renderBadge,
	renderTitle,
	renderBottomOfImage,
}: DefaultCardProps) => {
	// Format rating to show only one decimal place if available
	const rating = total_rating ?? aggregated_rating ?? null;
	const formattedRating = rating ? Math.round(rating) / 10 : null;

	return (
		<div className="group relative flex h-[350px] w-[200px] flex-col gap-2">
			{/* Top image */}

			<div className="group/link relative h-[85%] w-full">
				<div className="absolute top-2 right-2 z-10">
					{renderBadge ? (
						renderBadge(id)
					) : formattedRating ? (
						<Badge className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 text-sm shadow-lg backdrop-blur-sm">
							<Star size={14} className="fill-yellow-400 text-yellow-400" />
							<span className="font-medium">{formattedRating}</span>
						</Badge>
					) : null}
				</div>

				<Link
					to={"/info/$id"}
					params={{
						id: id.toString(),
					}}
				>
					<div className="absolute bottom-2 left-2 z-10">
						{renderBottomOfImage?.(id)}
					</div>

					{cover.type === "image_id" && cover.image ? (
						<IGDBImage
							alt={name}
							imageId={cover.image}
							className="group-focus-states/link:-translate-y-1.5 h-full w-full rounded-lg object-cover transition-transform"
						/>
					) : (
						<img
							src={cover.image}
							alt={name}
							className="group-focus-states/link:-translate-y-1.5 h-full w-full rounded-lg object-cover transition-transform"
						/>
					)}
				</Link>
			</div>

			{/* Under card */}
			<div className="mt-1 flex w-full flex-col gap-3">
				{renderTitle ? (
					renderTitle(id, name)
				) : (
					<H5 className="transform truncate text-center font-medium">{name}</H5>
				)}

				{renderActionButton?.(id)}
			</div>
		</div>
	);
};

export default DefaultCard;
