import {
  DownloadgameData,
  InfoItadProps,
  ItemDownload,
  SourceProvider,
} from "@/@types";
import { P } from "@/components/typography/p";
import { TypographySmall } from "@/components/typography/small";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useLanguageContext } from "@/contexts/I18N";
import UsePlugins from "@/hooks/usePlugins";
import { formatName } from "@/lib";
import { Website } from "@/lib/api/igdb/types";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import SourceShowcase from "./soruces";

interface DownloadDialogProps extends InfoItadProps {
  title: string;
  slug?: string;
  isReleased: boolean;
  websites: Website[];
  game_data: DownloadgameData;
}

const Sources = ({
  isReleased,
  itadData,
  title,
  game_data,
}: DownloadDialogProps) => {
  const { t } = useLanguageContext();
  const [selectedProvider, setSelectedProvider] = useState<SourceProvider>({
    value: "all",
    label: "All",
  });

  const { searchAllPlugins } = UsePlugins();

  const itadSources: ItemDownload[] = useMemo(
    () => [{ id: "itad", name: "IsThereAnyDeal", sources: itadData ?? [] }],
    [itadData]
  );

  const { data: pluginSources, isError } = useQuery<ItemDownload[]>({
    queryKey: ["sources", formatName(title)],
    queryFn: async () => {
      const plugins = await searchAllPlugins(formatName(title));
      return plugins.filter((plugin) => plugin.sources.length > 0);
    },
    enabled: isReleased,
    staleTime: 60000, // Cache for a minute to reduce unnecessary queries
  });

  const allSources = useMemo(
    () => [...itadSources, ...(pluginSources ?? [])],
    [itadSources, pluginSources]
  );

  const providers = useMemo((): Array<SourceProvider> => {
    return [
      {
        value: "all",
        label: "All",
      },
      ...allSources
        .filter((source) => source.sources.length > 0)
        .map((source) => ({
          value: source.id ?? "unknown",
          label: source.name ?? "Unknown",
        }))
        .filter((provider) => provider.value !== "unknown"),
    ];
  }, [allSources]);

  const filteredSources = useMemo((): Array<ItemDownload> => {
    if (selectedProvider.value === "all") return allSources;
    const searchValue = selectedProvider.value.toLowerCase();
    return allSources.filter((source) =>
      source.id?.toLowerCase().includes(searchValue)
    );
  }, [allSources, selectedProvider]);

  return (
    <div className="flex flex-col w-full gap-1">
      <TypographySmall>{t("sources")}</TypographySmall>

      <div className="flex flex-col gap-2">
        <Carousel
          opts={{
            skipSnaps: true,
            dragFree: true,
          }}
        >
          <CarouselContent>
            {providers.map((provider, i) => (
              <CarouselItem className="relative basis-auto" key={i}>
                <Button
                  variant={
                    selectedProvider.value === provider.value
                      ? "active"
                      : "default"
                  }
                  key={provider.value}
                  onClick={() => setSelectedProvider(provider)}
                >
                  {provider.label}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {isError ? (
          <P className="text-red-500">{t("error_loading_sources")}</P>
        ) : filteredSources?.length ? (
          <Carousel
            opts={{
              skipSnaps: true,
              dragFree: true,
            }}
            className="mt-2"
          >
            <CarouselContent>
              <SourceShowcase game_data={game_data} sources={filteredSources} />
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="flex items-center justify-start gap-2.5 mt-2 font-bold text-sm">
            <X className="size-7" />
            <P>{t("no_sources_found")}</P>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sources;
