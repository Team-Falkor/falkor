import Banner from "@/components/banner";
import CarouselButton from "@/components/carouselButton";
import { Carousel } from "@/components/ui/carousel";
import { H2, TypographySmall } from "@/components/ui/typography";
import { useLanguageContext } from "@/contexts/I18N";
import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const FeaturedGames = () => {
  const { t } = useLanguageContext();
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  return (
    <div className="mb-16  bg-linear-to-r from-background to-secondary/10 rounded-xl">
      <Carousel
        id="top-rated-carousel"
        plugins={[autoplay.current]}
        className="overflow-hidden rounded-xl ring-1 ring-muted/20 shadow-lg"
      >
        <div className="flex items-center justify-between w-full gap-2 p-4">
          <div className="flex items-end gap-3">
            <H2>{t("sections.top_rated")}</H2>

            <Link
              to={`/sections/topRated`}
              className="hover:underline text-muted-foreground hover:text-primary/80 transition-colors"
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
