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
	// The ID can be null if the item is not linkable
	id: number | null;
	total_rating?: number;
	aggregated_rating?: number;
	renderBadge?: (id: number | null) => React.ReactNode;
	renderTitle?: (id: number | null, name: string) => React.ReactNode;
	renderActionButton?: (id: number | null) => React.ReactNode;
	renderBottomOfImage?: (id: number | null) => React.ReactNode;
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
	// Determine if the link should be active or disabled
	const isLinkDisabled = id === null;

	// Format rating to show only one decimal place if available
	const rating = total_rating ?? aggregated_rating ?? null;
	const formattedRating = rating ? (Math.round(rating) / 10)?.toFixed(1) : null;

	// To avoid code duplication, we define the inner image content once.
	const CardImageContent = (
		<>
			{/* Fixed aspect ratio container */}
			<div className="relative h-[300px] w-full overflow-hidden">
				{cover.type === "image_id" && cover.image ? (
					<IGDBImage
						alt={name}
						imageId={cover.image}
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : cover.image ? (
					<img
						src={cover.image}
						alt={name}
						className="absolute inset-0 h-full w-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
						No Image
					</div>
				)}

				{/* Gradient Overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
			</div>
		</>
	);

	return (
		<div className="group w-[230px]">
			{/* Image Container - Fixed size */}
			<div className="relative mb-3 overflow-hidden rounded-lg">
				{isLinkDisabled ? (
					// If disabled, render a simple div with no interaction
					<div className="block">{CardImageContent}</div>
				) : (
					// If enabled, render the fully interactive Link
					<Link
						to="/info/$id"
						params={{
							// We know 'id' is a number here, so toString() is safe
							id: id.toString(),
						}}
						className="block transition-transform duration-300 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						style={{
							transformOrigin: "center center",
						}}
					>
						{CardImageContent}
					</Link>
				)}

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

			<div className="flex w-full flex-col gap-2">
				{/* Title */}
				<div className="min-h-[1.5rem]">
					{renderTitle ? (
						renderTitle(id, name)
					) : (
						<H5 className="line-clamp-2 overflow-hidden text-center font-medium text-sm leading-tight">
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
