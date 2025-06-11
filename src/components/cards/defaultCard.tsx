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
		<div className="group w-full max-w-[200px]">
			{/* Image Container */}
			<div className="relative mb-3">
				<Link
					to={"/info/$id"}
					params={{
						id: id.toString(),
					}}
					className="block overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					{/* Image */}
					<div className="relative aspect-[2/3] w-full bg-gray-200">
						{cover.type === "image_id" && cover.image ? (
							<IGDBImage
								alt={name}
								imageId={cover.image}
								className="h-full w-full object-cover"
							/>
						) : cover.image ? (
							<img
								src={cover.image}
								alt={name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
								No Image
							</div>
						)}

						{/* Gradient Overlay */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
					</div>
				</Link>

				{/* Rating Badge - Top Right */}
				<div className="absolute top-2 right-2 z-10">
					{renderBadge ? (
						renderBadge(id)
					) : formattedRating ? (
						<Badge className="flex items-center gap-1 bg-black/80 px-2 py-1 font-semibold text-white text-xs backdrop-blur-sm">
							<Star size={12} className="fill-yellow-400 text-yellow-400" />
							<span>{formattedRating}</span>
						</Badge>
					) : null}
				</div>

				{/* Bottom of Image Content */}
				{renderBottomOfImage && (
					<div className="absolute bottom-2 left-2 z-10">
						{renderBottomOfImage(id)}
					</div>
				)}
			</div>

			{/* Card Content */}
			<div className="space-y-3">
				{/* Title */}
				<div className="min-h-[1.5rem]">
					{renderTitle ? (
						renderTitle(id, name)
					) : (
						<H5 className="line-clamp-2 text-center font-medium text-sm leading-tight">
							{name}
						</H5>
					)}
				</div>

				{/* Action Button */}
				{renderActionButton && (
					<div className="flex justify-center">{renderActionButton(id)}</div>
				)}
			</div>
		</div>
	);
};

export default DefaultCard;
