import { PluginId } from "@team-falkor/shared-types";
import pluginHandler from "../../../handlers/plugins/plugin";
import { registerEvent } from "../utils/registerEvent";

const updatePlugin = async (
  _event: Electron.IpcMainInvokeEvent,
  pluginId: PluginId
) => {
  try {
    const updated = await pluginHandler.update(pluginId);

    return updated;
  } catch (error) {
    console.error(`Failed to update plugin: ${error}`);
    return [];
  }
};

registerEvent("plugins:update-plugin", updatePlugin);
