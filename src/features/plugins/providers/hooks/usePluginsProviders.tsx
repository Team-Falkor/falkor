import { useCallback, useState } from "react";
import { trpc } from "@/lib";

/**
 * Custom hook for plugin operations using tRPC.
 * Provides functionality for installation, deletion, enabling/disabling,
 * updates, and listing of plugins with cache invalidation.
 */
export const usePluginsProviders = () => {
	const [enabledOnly, setEnabledOnly] = useState(
		localStorage.getItem("showEnabledOnly") === "true",
	);

	const changeEnabledOnly = useCallback(() => {
		const currentValue = localStorage.getItem("showEnabledOnly") === "true";
		const newValue = !currentValue;

		localStorage.setItem("showEnabledOnly", String(newValue));
		setEnabledOnly(newValue);
	}, []);

	// tRPC context for cache operations
	const utils = trpc.useUtils();

	// Queries - enabledOnly will trigger refetch when changed
	const pluginsQuery = trpc.plugins.providers.list.useQuery(enabledOnly);
	const needsUpdateQuery =
		trpc.plugins.providers.checkForUpdatesAll.useQuery(false);

	// Mutations with cache invalidation
	const installPluginMutation = trpc.plugins.providers.install.useMutation({
		onSuccess: async () => await utils.plugins.providers.list.invalidate(),
	});

	const deletePluginMutation = trpc.plugins.providers.delete.useMutation({
		onSuccess: () => utils.plugins.providers.list.invalidate(),
	});

	const enablePluginMutation = trpc.plugins.providers.enable.useMutation({
		onSuccess: () => utils.plugins.providers.list.invalidate(),
	});

	const disablePluginMutation = trpc.plugins.providers.disable.useMutation({
		onSuccess: () => utils.plugins.providers.list.invalidate(),
	});

	const updatePluginMutation = trpc.plugins.providers.update.useMutation({
		onSuccess: () => {
			utils.plugins.providers.list.invalidate(undefined, {
				refetchType: "all",
			});
			utils.plugins.providers.checkForUpdatesAll.invalidate(undefined, {
				refetchType: "all",
			});
		},
	});

	const updateAllPluginsMutation = trpc.plugins.providers.updateAll.useMutation(
		{
			onSuccess: () => {
				utils.plugins.providers.list.invalidate(undefined, {
					refetchType: "all",
				});
				utils.plugins.providers.checkForUpdatesAll.invalidate(undefined, {
					refetchType: "all",
				});
			},
		},
	);

	// Callback to get plugins with optional force refresh
	const getPlugins = useCallback(
		async (forceRefresh?: boolean) => {
			if (forceRefresh) {
				await utils.plugins.providers.list.invalidate(undefined, {
					refetchType: "all",
				});
			}
			return pluginsQuery;
		},
		[pluginsQuery, utils.plugins.providers.list],
	);

	const searchAllPlugins = trpc.plugins.providers.searchAll.useQuery;

	return {
		// Queries
		plugins: pluginsQuery.data,
		isLoadingPlugins: pluginsQuery.isLoading,
		isFetchingPlugins: pluginsQuery.isFetching,
		isErrorPlugins: pluginsQuery.isError,
		errorPlugins: pluginsQuery.error,
		needsUpdate: needsUpdateQuery.data,

		// Get plugins with force refresh option
		getPlugins,

		// Search across all plugins and flatten all sources
		searchAllPlugins,

		// Plugin operations
		installPlugin: installPluginMutation.mutate,
		isInstalling: installPluginMutation.isPending,

		deletePlugin: deletePluginMutation.mutate,
		isDeleting: deletePluginMutation.isPending,

		enablePlugin: enablePluginMutation.mutate,
		isEnabling: enablePluginMutation.isPending,

		disablePlugin: disablePluginMutation.mutate,
		isDisabling: disablePluginMutation.isPending,

		updatePlugin: updatePluginMutation.mutate,
		isUpdating: updatePluginMutation.isPending,

		updateAllPlugins: updateAllPluginsMutation.mutate,
		isUpdatingAll: updateAllPluginsMutation.isPending,

		// Helpers
		refetchPlugins: pluginsQuery.refetch,
		invalidatePlugins: () => utils.plugins.providers.list.invalidate(),

		// State
		enabledOnly,
		changeEnabledOnly,
	};
};
