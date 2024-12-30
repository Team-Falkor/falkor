import { AchievementDBItem } from "@/@types";
import { invoke } from "@/lib";
import { useQuery } from "@tanstack/react-query";

export const useGetUnlockedAchievements = (gameId: string) => {
  const fetcher = async (): Promise<AchievementDBItem[]> => {
    const unlocked = await invoke<AchievementDBItem[], string>(
      "achievements:get-unlocked",
      gameId
    );
    return unlocked ?? [];
  };

  return useQuery({
    queryKey: ["achievements", "unlocked", gameId],
    queryFn: fetcher,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: !!gameId,
  });
};
