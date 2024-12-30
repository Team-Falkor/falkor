import { ISchemaForGame, ISchemaForGameAchievement } from "@/@types";
import { useSettings } from "@/hooks";
import { useQuery } from "@tanstack/react-query";

interface Achievement {
  steamId: string;
}

export const useGetAchievementsData = ({ steamId }: Achievement) => {
  const { settings } = useSettings();

  const fetcher = async (): Promise<Array<ISchemaForGameAchievement>> => {
    const apiURL = settings.api_base_url;
    const response = await fetch(`${apiURL}/achievements/${steamId}`);

    if (!response.ok) return [];

    const data: ISchemaForGame = await response.json();

    if (!data?.game?.availableGameStats?.achievements) return [];
    return data.game.availableGameStats.achievements;
  };

  return useQuery({
    queryKey: ["achievements", steamId],
    queryFn: fetcher,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: !!steamId,
  });
};
