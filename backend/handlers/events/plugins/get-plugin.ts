import { PluginId } from "@team-falkor/shared-types";
import pluginHandler from "../../../handlers/plugins/plugin";
import { registerEvent } from "../utils/registerEvent";

type getPluginResponse =
  | {
      message: string;
      success: boolean;
    }
  | {
      data: any;
      success: true;
    };

const getPlugin = async (
  _event: Electron.IpcMainInvokeEvent,
  pluginId: PluginId
): Promise<getPluginResponse> => {
  try {
    const plugin = await pluginHandler.get(pluginId);

    if (!plugin) {
      return {
        message: `no plugin found! with id: ${pluginId}`,
        success: false,
      };
    }

    return {
      data: plugin,
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

registerEvent("plugins:get", getPlugin);
