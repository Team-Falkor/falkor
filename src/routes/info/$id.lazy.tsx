import { InfoBar } from "@/components/info/infoBar";
import SimilarGames from "@/components/info/similar";
import InfoTop from "@/components/info/top";
import AchievementContainer from "@/features/achievements/components/container";
import {
  getSteamIdFromWebsites,
  getUserCountry,
  igdb,
  itad,
  Mapping,
} from "@/lib";
import { goBack } from "@/lib/history";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createLazyFileRoute("/info/$id")({
  component: Info,
});

function Info() {
  const { id } = Route.useParams();

  const { isPending, error, data } = useQuery({
    queryKey: ["igdb", "info", id],
    queryFn: async () => await igdb.info(id),
    enabled: !!id,
  });

  const releaseDate = useMemo(
    () =>
      data
        ? (data.release_dates?.find((item) => item.platform === 6) ??
          data.release_dates?.[0])
        : null,
    [data]
  );

  const isReleased = useMemo(
    () =>
      !releaseDate
        ? false
        : !releaseDate?.date || releaseDate.date < Date.now() / 1000,
    [releaseDate]
  );

  const itadQuery = useQuery({
    queryKey: ["itad", "prices", id],
    queryFn: async () => {
      if (!data) return;

      const itadSearch = await itad.gameSearch(data?.name);
      const mapping = new Mapping<any>(data?.name, itadSearch);
      const result = await mapping.compare();

      if (result) {
        const local = await getUserCountry();
        const itadPrices = await itad.gamePrices([result.id], local);
        return itadPrices;
      }
    },
    enabled: !!id && isReleased,
  });

  const steam_id = useMemo(
    () => getSteamIdFromWebsites(data?.websites ?? []),
    [data?.websites]
  );

  if (error) return null;

  return (
    <div className="relative w-full h-full pb-20 overflow-x-hidden max-w-[100vw]">
      {/* TOP BAR */}
      <InfoBar
        data={data}
        titleText={data?.name ?? ""}
        onBack={() => goBack()}
        isPending={isPending}
      />
      <div className="flex flex-col gap-12 px-5 mx-auto mt-4 overflow-hidden">
        <InfoTop
          data={data}
          isReleased={isReleased}
          error={error}
          isPending={isPending}
          releaseDate={releaseDate}
          itadData={itadQuery.data}
          itadError={itadQuery.error}
          itadPending={itadQuery.isPending}
          steamID={steam_id}
        />

        {!!steam_id && <AchievementContainer steamId={steam_id} />}

        <SimilarGames data={data?.similar_games ?? []} />
      </div>
    </div>
  );
}
