import Banner from "@/components/banner";
import CarouselButton from "@/components/carouselButton";
import MainContainer from "@/components/containers/mainContainer";
import RowContainer from "@/components/containers/row";
import { H1 } from "@/components/typography/h1";
import { H3 } from "@/components/typography/h3";
import { TypographyMuted } from "@/components/typography/muted";
import { TypographySmall } from "@/components/typography/small";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel } from "@/components/ui/carousel";
import { useLanguageContext } from "@/contexts/I18N";
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
      {/* Hero Section */}
      <div className="relative w-full mb-10 overflow-hidden rounded-xl bg-gradient-to-br from-background via-secondary/30 to-primary/20 p-8">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-gradient-to-bl from-primary to-transparent rounded-l-full"></div>
        <div className="relative z-10 flex flex-col items-start max-w-3xl gap-4">
          <H1 className="flex items-end gap-2">Falkor 
            <TypographyMuted>
              {t("logo_hover")}
            </TypographyMuted>

          </H1>
          <TypographyMuted className="text-lg">
            Discover, play, and manage your favorite games in one place
          </TypographyMuted>
          <div className="flex gap-4 mt-2">
            <Link to="/library" className={
              buttonVariants({
                variant: "active",
              })
            }>
            Browse Library
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Games Carousel */}
      <div className="mb-16">
        <Carousel id="top-rated-carousel" plugins={[autoplay.current]} 
          className="overflow-hidden rounded-xl ring-1 ring-muted/20 shadow-lg">
          <div className="flex items-center justify-between w-full gap-2 p-4 bg-gradient-to-r from-background to-secondary/10">
            <div className="flex items-end gap-3">
              <H3>
                {t("sections.top_rated")}
              </H3>

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

      {/* Game Categories */}
      <div className="grid grid-cols-1 gap-6 mb-16 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Action", icon: "🎮", id: "1", type: "theme" },
          { title: "Adventure", icon: "🗺️", id: "31", type: "genre" },
          { title: "RPG", icon: "⚔️", id: "12", type: "genre" },
          { title: "Strategy", icon: "🧠", id: "15", type: "genre" },
        ].map((category) => (
          <Card key={category.title} className="overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20 group">
            <CardContent className="p-0">
              <Link 
                to={category.type === "theme" ? "/theme/$themeId" : "/genre/$genreId"} 
                params={category.type === "theme" ? { themeId: category.id } : { genreId: category.id }} 
                className="block p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 text-2xl rounded-full">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{category.title}</h3>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                      →
                    </Button>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Rows */}
      <div className="space-y-14">
        <RowContainer
          id="new-releases-row"
          title={t("sections.new_releases")}
          dataToFetch="newReleases"
          className="ring-1 ring-muted/20 rounded-xl p-4 shadow-sm bg-gradient-to-r from-background to-secondary/5"
        />

        <RowContainer
          id="most-anticipated-row"
          title={t("sections.most_anticipated")}
          dataToFetch="mostAnticipated"
          className="ring-1 ring-muted/20 rounded-xl p-4 shadow-sm bg-gradient-to-r from-background to-secondary/5"
        />
      </div>
    </MainContainer>
  );
}
