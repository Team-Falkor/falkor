import { Star, StarHalf } from "lucide-react";

interface StarsProps {
	stars: number; // Rating out of 10
}

const Stars = ({ stars }: StarsProps) => {
	if (stars === 0) return null;

	const actual_stars = stars / 2; // Convert to a 5-star scale
	const fullStars = Math.floor(actual_stars); // Full stars
	const hasHalfStar = actual_stars % 1 >= 0.5; // Half star if fractional part >= 0.5

	return (
		<div className="flex items-center gap-0.5">
			{/* Render full stars */}
			{Array.from({ length: fullStars }, (_, i) => (
				<Star
					key={`full-${i}`}
					className="size-4 fill-yellow-400 text-yellow-400"
				/>
			))}

			{/* Render half star if applicable */}
			{hasHalfStar && (
				<div className="relative size-4">
					<StarHalf className="absolute inset-0 size-full fill-yellow-400 text-yellow-400" />
					<Star className="absolute inset-0 size-full text-yellow-400" />
				</div>
			)}
		</div>
	);
};

export default Stars;
