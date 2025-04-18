import DefaultCard from "@/components/cards/defaultCard";
import CarouselButton from "@/components/carouselButton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { H2 } from "@/components/ui/typography";
import { useLanguageContext } from "@/contexts/I18N";
import { IGDBReturnDataType } from "@/lib/api/igdb/types";
import { useMemo } from "react";

interface SimilarGamesProps {
  data: IGDBReturnDataType["similar_games"];
}

const SimilarGames = ({ data }: SimilarGamesProps) => {
  const { t } = useLanguageContext();

  const items = useMemo(() => data, [data]);

  if (!items?.length) return null;

  return (
    <div>
      <Carousel
        opts={{
          skipSnaps: true,
          dragFree: true,
        }}
        className="w-full"
      >
        <div className="flex justify-between mb-2">
          <H2>{t("you_may_also_like")}</H2>
          <div>
            <CarouselButton direction="left" />
            <CarouselButton direction="right" />
          </div>
        </div>

        <CarouselContent className="-ml-2">
          {items.map((game) => (
            <CarouselItem key={game.id} className="px-2 basis-auto">
              <DefaultCard key={game.id} {...game} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default SimilarGames;
