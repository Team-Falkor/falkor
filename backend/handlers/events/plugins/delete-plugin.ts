import { PluginId } from "@team-falkor/shared-types";
import pluginHandler from "../../../handlers/plugins/plugin";
import { registerEvent } from "../utils/registerEvent";

const deletePlugin = async (
  _event: Electron.IpcMainInvokeEvent,
  pluginId: PluginId
): Promise<{
  message: string;
  success: boolean;
}> => {
  try {
    const deleted = await pluginHandler.delete(pluginId);

    if (!deleted) {
      return {
        message: "Failed to deleted plugin",
        success: false,
      };
    }

    return {
      message: "Plugin deleted successfully",
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

registerEvent("plugins:delete", deletePlugin);
