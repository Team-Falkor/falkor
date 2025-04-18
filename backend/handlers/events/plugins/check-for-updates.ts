import { PluginId, PluginSetupJSONDisabled } from "@team-falkor/shared-types";
import pluginHandler from "../../../handlers/plugins/plugin";
import { registerEvent } from "../utils/registerEvent";

const checkForUpdates = async (
  _event: Electron.IpcMainInvokeEvent,
  pluginId?: PluginId
): Promise<boolean | Array<PluginSetupJSONDisabled>> => {
  try {
    const plugins = pluginId
      ? await pluginHandler.checkForUpdates(pluginId)
      : await pluginHandler.checkForUpdatesAll();

    return plugins;
  } catch (error) {
    console.error(`Failed to check for updates: ${error}`);
    return false;
  }
};

registerEvent("plugins:check-for-updates", checkForUpdates);
