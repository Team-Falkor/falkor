import { AchievementDBItem } from "@/@types";
import { invoke } from "@/lib";
import { useQuery } from "@tanstack/react-query";

export const useGetUnlockedAchievements = (gameId: string) => {
  return useQuery({
    queryKey: ["achievements", "unlocked", gameId],
    queryFn: async () => {
      const unlocked = await invoke<AchievementDBItem[], string>(
        "achievements:get-unlocked",
        gameId
      );
      return unlocked ?? [];
    },
  });
};
