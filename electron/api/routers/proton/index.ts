import { publicProcedure, router } from "@backend/api/trpc";
import protonManager from "@backend/utils/proton-manager";
import type {
	DownloadProgressEvent,
	DownloadStatusEvent,
	ExtractionProgressEvent,
} from "@team-falkor/game-launcher";
import { observable } from "@trpc/server/observable";
import z from "zod";

// Input validation schemas
const ProtonVariantSchema = z.enum(["proton-ge"]);

const InstallProtonSchema = z.object({
	version: z.string(),
	variant: ProtonVariantSchema,
	installPath: z.string().optional(),
	force: z.boolean().optional().default(false),
});

const RemoveProtonSchema = z.object({
	version: z.string(),
	variant: ProtonVariantSchema,
});

const GetVersionsForVariantSchema = z.object({
	variant: ProtonVariantSchema,
});

const SearchVersionsSchema = z.object({
	query: z.string().min(1),
});

export const protonRouter = router({
	// List all available Proton versions from various sources
	listAvailableVersions: publicProcedure.query(async () => {
		return await protonManager.listAvailableProtonVersions();
	}),

	// Get versions for a specific variant
	getVersionsForVariant: publicProcedure
		.input(GetVersionsForVariantSchema)
		.query(async ({ input }) => {
			return await protonManager.getVersionsForVariant(input.variant);
		}),

	// Get the latest version for a specific variant
	getLatestVersion: publicProcedure
		.input(GetVersionsForVariantSchema)
		.query(async ({ input }) => {
			return await protonManager.getLatestVersion(input.variant);
		}),

	// Search for versions matching a query
	searchVersions: publicProcedure
		.input(SearchVersionsSchema)
		.query(async ({ input }) => {
			return await protonManager.searchVersions(input.query);
		}),

	// Get version statistics
	getVersionStats: publicProcedure.query(async () => {
		return await protonManager.getVersionStats();
	}),

	// Get installed Proton builds
	getInstalledBuilds: publicProcedure.query(async () => {
		return await protonManager.getInstalledProtonBuilds();
	}),

	// Get currently active Steam Proton build
	getActiveSteamBuild: publicProcedure.query(async () => {
		return await protonManager.getActiveSteamProtonBuild();
	}),

	// Check if Proton is supported on current system
	isProtonSupported: publicProcedure.query(() => {
		return protonManager.isProtonSupported();
	}),

	// Get platform information
	getPlatformInfo: publicProcedure.query(() => {
		return protonManager.getPlatformInfo();
	}),

	// Check if installation is supported
	isInstallationSupported: publicProcedure.query(() => {
		return protonManager.isInstallationSupported();
	}),

	// Get compatibility tools directory path
	getCompatibilityToolsDirectory: publicProcedure.query(() => {
		return protonManager.getCompatibilityToolsDirectory();
	}),

	// Install a Proton version
	installVersion: publicProcedure
		.input(InstallProtonSchema)
		.mutation(async ({ input }) => {
			return await protonManager.installProtonVersion(input);
		}),

	// Remove a Proton version
	removeVersion: publicProcedure
		.input(RemoveProtonSchema)
		.mutation(async ({ input }) => {
			return await protonManager.removeProtonVersion(input);
		}),

	// Install the latest version of a specific variant
	installLatestVersion: publicProcedure
		.input(
			z.object({
				variant: ProtonVariantSchema,
			}),
		)
		.mutation(async ({ input }) => {
			return await protonManager.installLatestVersion(input.variant);
		}),

	// Clear all caches
	clearCache: publicProcedure.mutation(() => {
		protonManager.clearCache();
		return { success: true };
	}),

	// Refresh all caches
	refreshVersions: publicProcedure.mutation(async () => {
		return await protonManager.refreshVersions();
	}),

	// Subscribe to installation progress events
	subscribeToInstallProgress: publicProcedure.subscription(() => {
		return observable<{
			type:
				| "status"
				| "downloadProgress"
				| "extractionProgress"
				| "complete"
				| "error";
			data:
				| DownloadStatusEvent
				| DownloadProgressEvent
				| ExtractionProgressEvent
				| { variant: string; version: string }
				| { error: string };
		}>((emit) => {
			// Set up event listeners for download progress
			protonManager.onInstallStatus((event: DownloadStatusEvent) => {
				emit.next({
					type: "status",
					data: event,
				});
			});

			protonManager.onDownloadProgress((event: DownloadProgressEvent) => {
				emit.next({
					type: "downloadProgress",
					data: event,
				});
			});

			// Listen for extraction progress events
			protonManager.onExtractionProgress((event: ExtractionProgressEvent) => {
				emit.next({
					type: "extractionProgress",
					data: event,
				});
			});

			protonManager.onInstallComplete((event) => {
				emit.next({
					type: "complete",
					data: event,
				});
			});

			protonManager.onInstallError((event) => {
				emit.next({
					type: "error",
					data: event,
				});
			});

			// TO DO: Remove event listeners
			return () => {};
		});
	}),
});

export type ProtonRouter = typeof protonRouter;
