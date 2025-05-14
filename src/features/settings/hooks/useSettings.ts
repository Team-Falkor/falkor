import { trpc } from "@/lib";

/**
 * Custom hook for settings operations using tRPC.
 * Provides read, get-by-key, update, and reset functionality,
 * with cache invalidation on mutations.
 */
export function useSettings() {
	// tRPC context for cache operations
	const utils = trpc.useUtils();

	// Fetch all settings
	const settingsQuery = trpc.settings.read.useQuery();

	// Lazy get: returns a function to fetch a single setting by key
	const getSetting = trpc.settings.get.useQuery;

	// Update a setting and invalidate cache on success
	const updateSettingMutation = trpc.settings.update.useMutation({
		onSuccess: () => utils.settings.invalidate(),
	});

	// Reset all settings and invalidate cache on success
	const resetSettingsMutation = trpc.settings.reset.useMutation({
		onSuccess: () => utils.settings.invalidate(),
	});

	return {
		// Queries
		settings: settingsQuery.data,
		isLoadingSettings: settingsQuery.isLoading,
		isFetchingSettings: settingsQuery.isFetching,

		// Get single setting
		getSetting,

		// Mutations
		updateSetting: updateSettingMutation.mutate,
		isUpdating: updateSettingMutation.isPending,

		resetSettings: resetSettingsMutation.mutate,
		isResetting: resetSettingsMutation.isPending,

		// Helpers
		refetchSettings: settingsQuery.refetch,
		invalidateSettings: () => utils.settings.read.invalidate(),
	};
}
