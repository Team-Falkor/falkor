import Banner from "@/components/banner";
import CarouselButton from "@/components/carouselButton";
import MainContainer from "@/components/containers/mainContainer";
import RowContainer from "@/components/containers/row";
import { H3 } from "@/components/typography/h3";
import { Carousel } from "@/components/ui/carousel";
import { useLanguageContext } from "@/contexts/I18N";
import { cn } from "@/lib";
import { createFileRoute, Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useLanguageContext();
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  return (
    <MainContainer id="main-page" className="w-full overflow-hidden">
      <Carousel id="top-rated-carousel" plugins={[autoplay.current]}>
        <div className="flex items-center justify-between w-full gap-2 mb-2">
          <div className="flex items-end gap-3">
            <H3>{t("sections.top_rated")}</H3>

            <Link
              to={`/sections/topRated`}
              className={cn("p-0 m-0 text-sm text-slate-400 hover:underline")}
            >
              {t("view_more")}
            </Link>
          </div>

          <div>
            <CarouselButton direction="left" id="top-rated-left-btn" />
            <CarouselButton direction="right" id="top-rated-right-btn" />
          </div>
        </div>

        <Banner id="top-rated-banner" />
      </Carousel>

      <div className="mt-16 space-y-14">
        <RowContainer
          id="new-releases-row"
          title={t("sections.new_releases")}
          dataToFetch="newReleases"
        />

        <RowContainer
          id="most-anticipated-row"
          title={t("sections.most_anticipated")}
          dataToFetch="mostAnticipated"
        />
      </div>
    </MainContainer>
  );
}
