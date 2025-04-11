import { DownloadgameData, ItemDownload } from "@/@types";
import { SourceCard } from "@/components/cards/sourcecard";
import { CarouselItem } from "@/components/ui/carousel";
import { ITADPrice } from "@/lib/api/itad/types";
import { PluginSearchResponse } from "@team-falkor/shared-types";
import { useMemo } from "react";

interface SourceShowcaseProps {
  sources: ItemDownload[];
  game_data: DownloadgameData;
  slug?: string;
}

const SourceShowcase = ({ sources, game_data, slug }: SourceShowcaseProps) => {
  const renderedSources = useMemo(() => {
    return sources?.flatMap((item) => {
      if (item.id === "itad") {
        return (item.sources as ITADPrice[]).flatMap((source) =>
          source.deals?.map((deal, i) => (
            <CarouselItem
              key={`${item.id}-${i}`}
              className="relative overflow-hidden sm:basis-1/2 md:basis-1/2 2xl:basis-1/3"
            >
              <SourceCard source={deal} />
            </CarouselItem>
          ))
        );
      }

      return (item.sources as PluginSearchResponse[]).map((source, i) => (
        <CarouselItem
          key={`${item.id}-${i}`}
          className="relative overflow-hidden sm:basis-1/2 md:basis-1/2 2xl:basis-1/3"
        >
          <SourceCard
            source={source}
            pluginId={item.id}
            game_data={game_data}
            multiple_choice={item?.multiple_choice}
            slug={slug}
          />
        </CarouselItem>
      ));
    });
  }, [sources, game_data, slug]);

  return renderedSources;
};

export default SourceShowcase;
