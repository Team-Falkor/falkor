import { PluginId } from "@team-falkor/shared-types";
import pluginHandler from "../../../handlers/plugins/plugin";
import { registerEvent } from "../utils/registerEvent";

const enablePlugin = async (
  _event: Electron.IpcMainInvokeEvent,
  pluginId: PluginId
): Promise<{
  message: string;
  success: boolean;
}> => {
  try {
    const enabled = await pluginHandler.enable(pluginId);

    if (!enabled) {
      return {
        message: "Failed to enable plugin",
        success: false,
      };
    }

    return {
      message: "Plugin enabled successfully",
      success: true,
    };
  } catch (error) {
    console.error(error);

    return {
      message: (error as Error).message,
      success: false,
    };
  }
};

registerEvent("plugins:enable", enablePlugin);
