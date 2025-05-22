import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { IGDBReturnDataType, SimilarGame } from "@/@types";
import IGDBImage from "../IGDBImage";
import { Badge } from "../ui/badge";
import { H5 } from "../ui/typography";

type DefaultCardProps = (IGDBReturnDataType | SimilarGame) & {
	wantCountdown?: boolean;
	playtime?: number;
};

const DefaultCard = ({
	cover,
	name,
	id,
	total_rating,
	aggregated_rating,
}: DefaultCardProps) => {
	// Format rating to show only one decimal place if available
	const rating = total_rating ?? aggregated_rating ?? null;
	const formattedRating = rating ? Math.round(rating) / 10 : null;

	return (
		<Link to={"/info/$id"} params={{ id: id.toString() }}>
			<div className="group relative flex h-[300px] w-[200px] flex-col overflow-hidden rounded-lg border transition-shadow duration-300 focus-states:border-border focus-states:shadow-xl">
				{/* IMAGE */}
				<div className="absolute inset-0 z-0 overflow-hidden transition-transform duration-300 group-focus-states:scale-105">
					<IGDBImage
						alt={name}
						imageId={cover?.image_id}
						className="h-full w-full object-cover"
					/>

					<span className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
				</div>

				{/* CONTENT */}
				<div className="relative z-10 flex h-full flex-col justify-between p-3 px-4">
					<div className="flex w-full items-end justify-end">
						{formattedRating && (
							<Badge className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 text-sm shadow-lg backdrop-blur-sm">
								<Star size={14} className="fill-yellow-400 text-yellow-400" />
								<span className="font-medium">{formattedRating}</span>
							</Badge>
						)}
					</div>

					<H5 className="group-focus-states:-translate-y-1 line-clamp-2 transform text-pretty transition-all duration-300 group-focus-states:opacity-100">
						{name}
					</H5>
				</div>
			</div>
		</Link>
	);
};

export default DefaultCard;
