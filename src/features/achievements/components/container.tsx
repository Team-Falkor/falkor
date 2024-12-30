import CarouselButton from "@/components/carouselButton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { t } from "i18next";
import { useEffect } from "react";
import { useGetAchievementsData } from "../hooks/useGetAchievementsData";
import { useGetUnlockedAchievements } from "../hooks/useGetUnlockedAchievements";
import { AchievementCard } from "./cards/achievement";

interface Props {
  steamId: string;
  gameId: string;
}

const AchievementContainer = ({ steamId, gameId }: Props) => {
  const { isPending, isError, data } = useGetAchievementsData({ steamId });
  const { isPending: unlockedPending, data: unlocked } =
    useGetUnlockedAchievements(gameId);

  useEffect(() => {
    console.log(data);
  }, [data]);

  if (isPending || unlockedPending) return null;
  if (isError) return null;

  if (!data?.length) return null;

  const dataWithUnlocked = data
    .map((item) => {
      const isUnlocked = unlocked?.find(
        (u) => u.achievement_name === item.name
      );
      return { ...item, unlocked: !!isUnlocked };
    })
    ?.sort(
      (a, b) =>
        (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0) ||
        a.name.localeCompare(b.name)
    );

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
            <p className="text-sm text-muted-foreground">
              {unlocked?.length}/{data.length}
            </p>
          </h1>
          <div>
            <CarouselButton direction="left" />
            <CarouselButton direction="right" />
          </div>
        </div>
      </div>

      <CarouselContent className="-ml-2">
        {dataWithUnlocked.map((achievement, i) => {
          const isUnlocked = unlocked
            ? unlocked.find(
                (item) => item.achievement_name === achievement.name
              )
            : false;

          return (
            <CarouselItem key={`achievement-${i}`} className="px-2 basis-auto">
              <AchievementCard
                key={`achievement-${i}`}
                {...achievement}
                unlocked={!!isUnlocked}
              />
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};

export default AchievementContainer;
