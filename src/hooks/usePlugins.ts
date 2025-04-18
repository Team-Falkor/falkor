import { invoke } from "@/lib";
import { usePluginsStore } from "@/stores/plugins";
import { PluginSetupJSONDisabled } from "@team-falkor/shared-types";
import { useCallback, useEffect } from "react";
import { useSettings } from "./useSettings";
import { SearchPluginResponse } from "@/@types";

type InvokeReturn = {
  data: PluginSetupJSONDisabled[];
  success: boolean;
  message?: string;
};

const UsePlugins = () => {
  const {
    plugins,
    setPlugins,
    checkForUpdates,
    hasDoneFirstCheck,
    needsUpdate,
    setHasDoneFirstCheck,
    setNeedsUpdate,
    removeNeedsUpdate,
  } = usePluginsStore();
  const { settings } = useSettings();

  const getPlugins = useCallback(
    async (wantDisabled: boolean = false) => {
      const list = await invoke<InvokeReturn, boolean>(
        "plugins:list",
        wantDisabled
      );
      if (list?.success) {
        setPlugins(list.data);
      } else {
        console.error(`Failed to load plugins: ${list?.message}`);
      }
      return list;
    },
    [setPlugins]
  );

  const searchAllPlugins = async (query: string) => {
    const searchResults = await invoke<SearchPluginResponse, string>(
      "plugins:use:search",
      query
    );

    if (!searchResults?.success) return [];

    return searchResults.data;
  };

  useEffect(() => {
    if (hasDoneFirstCheck || !getPlugins || plugins.size) return;
    getPlugins();
    if (settings?.checkForPluginUpdatesOnStartup) {
      checkForUpdates();
    }
    setHasDoneFirstCheck();
  }, [
    checkForUpdates,
    getPlugins,
    hasDoneFirstCheck,
    plugins,
    setHasDoneFirstCheck,
    settings.checkForPluginUpdatesOnStartup,
  ]);

  return {
    plugins,
    getPlugins,
    searchAllPlugins,
    needsUpdate,
    setNeedsUpdate,
    removeNeedsUpdate,
  };
};

export default UsePlugins;
