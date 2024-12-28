import CarouselButton from "@/components/carouselButton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { t } from "i18next";
import { useEffect } from "react";
import { useGetAchievementsData } from "../hooks/useGetAchievementsData";
import { AchievementCard } from "./cards/achievement";

interface Props {
  steamId: string;
}

const AchievementContainer = ({ steamId }: Props) => {
  const { isPending, isError, data } = useGetAchievementsData({ steamId });

  useEffect(() => {
    console.log(data);
  }, [data]);

  if (isPending) return null;
  if (isError) return null;

  if (!data?.length) return null;

  return (
    <Carousel
      opts={{
        skipSnaps: true,
        dragFree: true,
      }}
      className="w-full"
    >
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex justify-between">
          <h1 className="flex items-end gap-2 text-xl font-medium capitalize">
            {t("achievements")}
            <p className="text-sm text-muted-foreground">0/{data.length}</p>
          </h1>
          <div>
            <CarouselButton direction="left" />
            <CarouselButton direction="right" />
          </div>
        </div>
      </div>

      <CarouselContent className="-ml-2">
        {data.map((achievement, i) => (
          <CarouselItem key={`achievement-${i}`} className="px-2 basis-auto">
            <AchievementCard key={`achievement-${i}`} {...achievement} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default AchievementContainer;
