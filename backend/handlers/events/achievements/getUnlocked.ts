import { achievementsDB } from "../../../sql";
import { registerEvent } from "../utils";

const handler = async (_event: Electron.IpcMainInvokeEvent, gameId: string) => {
  try {
    const unlocked = await achievementsDB.getUnlockedAchievements(gameId);
    return unlocked;
  } catch (error) {
    console.error(error);
    return [];
  }
};

registerEvent("achievements:get-unlocked", handler);
