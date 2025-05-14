import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import Banner from "@/components/banner";
import CarouselButton from "@/components/carouselButton";
import { Carousel } from "@/components/ui/carousel";
import { H2, TypographySmall } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

const FeaturedGames = () => {
	const { t } = useLanguageContext();
	const autoplay = useRef(
		Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
	);

	return (
		<div className="mb-16 rounded-xl bg-linear-to-r from-background to-secondary/10">
			<Carousel
				id="top-rated-carousel"
				plugins={[autoplay.current]}
				className="overflow-hidden rounded-xl shadow-lg ring-1 ring-muted/20"
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
							className="text-muted-foreground transition-colors hover:text-primary/80 hover:underline"
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
			</Carousel>
		</div>
	);
};

export default FeaturedGames;
