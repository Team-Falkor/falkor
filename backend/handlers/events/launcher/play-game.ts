import { LauncherExtra } from "../../../@types";
import GameProcessLauncher from "../../../handlers/launcher/gameProcessLauncher";
import { gamesDB } from "../../../sql";
import { gamesLaunched } from "../../launcher/games_launched";
import { registerEvent } from "../utils/registerEvent";

const playGame = async (
  _event: Electron.IpcMainInvokeEvent,
  game_path: string,
  game_id: string,
  _extra?: LauncherExtra
) => {
  try {
    if (gamesLaunched.has(game_id)) {
      console.log("Game already launched");
      return true;
    }
    const game_info = await gamesDB.getGameById(game_id);

    if (!game_info) {
      console.log("Game not found");
      return false;
    }

    const launcher = new GameProcessLauncher({
      game_name: game_info.game_name,
      game_path,
      steam_id: game_info.game_steam_id,
      game_icon: game_info.game_icon,
      game_id: game_info.game_id,
    });
    launcher.launchGame();
    gamesLaunched.set(game_id, launcher);

    return true;
  } catch (error) {
    console.error("Failed to launch game:", error);
    return false;
  }
};

registerEvent("launcher:play-game", playGame);
