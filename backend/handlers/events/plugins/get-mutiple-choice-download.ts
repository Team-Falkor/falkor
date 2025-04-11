import { PluginId } from "@team-falkor/shared-types";
import pluginHandler from "../../../handlers/plugins/plugin";
import { registerEvent } from "../utils/registerEvent";

const getMultipleChoiceDownload = async (
  _event: Electron.IpcMainInvokeEvent,
  pluginId: PluginId,
  base64Url: string
): Promise<string[]> => {
  try {
    const plugin = await pluginHandler.get(pluginId);

    if (!plugin) return [];

    const url = `${plugin.api_url}/return/${base64Url}`;

    const response = await fetch(url);

    if (!response.ok) return [];

    const json: string[] = await response.json();

    return json;
  } catch (error) {
    console.error(error);
    return [];
  }
};

registerEvent(
  "plugins:use:get-multiple-choice-download",
  getMultipleChoiceDownload
);
