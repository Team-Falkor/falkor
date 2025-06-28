// src/components/featuredGames.tsx

import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, useState } from "react"; // Import useState, useEffect
import Banner from "@/components/banner";
import CarouselButton from "@/components/carouselButton";
// Import Carousel and CarouselApi type
import { Carousel, type CarouselApi } from "@/components/ui/carousel";
import { H2, TypographySmall } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

const FeaturedGames = () => {
	const { t } = useLanguageContext();
	const autoplay = useRef(
		Autoplay({ delay: 10000, stopOnInteraction: true, stopOnMouseEnter: true }),
	);

	const [api, setApi] = useState<CarouselApi>();
	const [currentSlide, setCurrentSlide] = useState(0);
	const [totalSlides, setTotalSlides] = useState(0);

	// Effect to manage carousel state
	useEffect(() => {
		if (!api) {
			return;
		}

		const updateSlideInfo = () => {
			setTotalSlides(api.scrollSnapList().length);
			setCurrentSlide(api.selectedScrollSnap() + 1);
		};

		updateSlideInfo();

		api.on("select", updateSlideInfo);

		return () => {
			api.off("select", updateSlideInfo);
		};
	}, [api]);

	return (
		<div className="mb-16 rounded-lg bg-muted/30">
			<Carousel
				id="top-rated-carousel"
				plugins={[autoplay.current]}
				className="relative rounded-lg shadow-lg ring-1 ring-muted/20"
				setApi={setApi}
			>
				<div className="flex w-full items-center justify-between gap-2 p-4">
					<div className="flex items-end gap-3">
						<H2>{t("sections.top_rated")}</H2>

						<Link
							to={"/filter"}
							search={{
								sort: "rating desc",
								minRating: 85,
							}}
							className="text-muted-foreground transition-colors focus-states:text-primary/80 focus-states:underline"
						>
							<TypographySmall>{t("view_more")}</TypographySmall>
						</Link>
					</div>

					<div className="flex gap-2">
						<CarouselButton direction="left" id="top-rated-left-btn" />
						<CarouselButton direction="right" id="top-rated-right-btn" />
					</div>
				</div>

				<Banner id="top-rated-banner" />

				{totalSlides > 1 && (
					<div className="absolute right-6 bottom-4 z-30 rounded-full bg-black/40 px-3 py-1 font-medium text-sm text-white/70 shadow-md backdrop-blur-sm">
						{currentSlide} / {totalSlides}
					</div>
				)}
			</Carousel>
		</div>
	);
};

export default FeaturedGames;
