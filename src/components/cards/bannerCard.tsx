import { Link } from "@tanstack/react-router";
import { Info, Play } from "lucide-react";
import type { IGDBReturnDataType } from "@/@types";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib/utils";
import IGDBImage from "../IGDBImage";
import TrailerButton from "../trailer";
import { buttonVariants } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { H1, P } from "../ui/typography";

const BannerCard = ({
	cover,
	name,
	summary,
	storyline,
	id,
	videos,
}: IGDBReturnDataType) => {
	const { t } = useLanguageContext();

	// Get the best available description
	const description = storyline || summary || t("no_description_available");

	return (
		<Card className="group relative h-[24rem] w-full overflow-hidden rounded-t-none border-0 bg-transparent p-0 shadow-2xl transition-all duration-500 ease-out hover:shadow-3xl sm:h-[28rem] lg:h-[32rem] xl:h-[36rem]">
			{/* Background Image Container */}
			<div className="absolute inset-0 overflow-hidden">
				{/* Enhanced gradient overlay for better text readability */}
				<div className="absolute inset-0 z-10 bg-gradient-to-t from-background/80 to-background/20" />
				<div className="absolute inset-0 z-10 bg-gradient-to-r from-background/30 via-transparent to-transparent" />

				{/* Background Image */}
				<IGDBImage
					imageSize="original"
					imageId={cover.image_id}
					className="h-full w-full scale-100 transform object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
					alt={name}
				/>
			</div>

			{/* Content Container */}
			<CardContent className="relative z-20 flex h-full flex-col justify-end p-6 md:p-8 lg:p-10">
				{/* Increased max-width for overall content for better desktop use */}
				<div className="max-w-[95%] space-y-4 md:max-w-[90%]">
					{/* Title (kept as previous) */}
					<H1
						className={cn(
							"text-white drop-shadow-2xl transition-all duration-300",
							"text-4xl sm:text-5xl lg:text-6xl xl:text-7xl",
							"font-bold leading-tight tracking-tight",
						)}
					>
						{name}
					</H1>

					{/* Description - Adjusted text sizing (smaller) */}
					<div className="max-w-xl md:max-w-2xl lg:max-w-3xl">
						<P
							className={cn(
								"text-white/90 drop-shadow-lg transition-all duration-300",
								// Adjusted: Base 14px, scales to 16px on larger screens
								"text-sm sm:text-base",
								"line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 xl:line-clamp-6",
								"leading-relaxed",
							)}
						>
							{description}
						</P>
					</div>

					{/* Action Buttons (kept as previous) */}
					<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4 sm:pt-4">
						<Link
							to="/info/$id"
							params={{ id: id.toString() }}
							className={cn(
								buttonVariants({
									variant: "active",
									size: "lg",
								}),
								"backdrop-blur-sm transition-all duration-300",
								"hover:scale-105 hover:shadow-lg",
								"focus-visible:ring-2 focus-visible:ring-primary/50",
								"group/button",
							)}
						>
							<Info className="transition-transform group-hover/button:scale-110" />
							{t("more_info")}
						</Link>

						{videos && videos.length > 0 && (
							<TrailerButton
								name={name}
								videos={videos}
								className={cn(
									buttonVariants({
										variant: "outline",
										size: "lg",
									}),
									"border-white/30 bg-white/10 text-white backdrop-blur-sm",
									"hover:scale-105 hover:border-white/50 hover:bg-white/20",
									"transition-all duration-300",
									"group/trailer",
								)}
							>
								<Play className=" transition-transform group-hover/trailer:scale-110" />
								{t("trailer")}
							</TrailerButton>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default BannerCard;
