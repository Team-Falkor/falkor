import { publicProcedure, router } from "@backend/api/trpc";
import pluginProviderHandler from "@backend/handlers/plugins/providers/handler";
import { getOS } from "@backend/utils/utils";
import type { PluginId, PluginSearchResponse } from "@team-falkor/shared-types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Input validation schemas
export const pluginIdSchema = z.string().refine(
	(val): val is PluginId =>
		// matches "foo.bar" or "foo.bar.baz" but no more or less segments
		/^[^.]+\.[^.]+(?:\.[^.]+)?$/.test(val),
	{
		message: "Invalid PluginId. Must be in the form 'xxx.yyy' or 'xxx.yyy.zzz'",
	},
);
const urlSchema = z
	.string()
	.url("Invalid URL format")
	.refine((val) => val.includes("setup.json"), {
		message: "URL must include 'setup.json'",
	});
const booleanSchema = z.boolean().default(false);

export const pluginProvidersRouter = router({
	// Install a plugin from a URL
	install: publicProcedure.input(urlSchema).mutation(async ({ input }) => {
		const success = await pluginProviderHandler.install(input);
		if (!success) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to install plugin",
			});
		}
		return { success, message: "Plugin installed successfully" };
	}),

	// Delete a plugin by ID
	delete: publicProcedure.input(pluginIdSchema).mutation(async ({ input }) => {
		const success = await pluginProviderHandler.delete(input);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Plugin not found",
			});
		}
		return { success };
	}),

	// Enable a plugin
	enable: publicProcedure.input(pluginIdSchema).mutation(async ({ input }) => {
		const success = await pluginProviderHandler.enable(input);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Plugin not found or already enabled",
			});
		}
		return { success };
	}),

	// Disable a plugin
	disable: publicProcedure.input(pluginIdSchema).mutation(async ({ input }) => {
		const success = await pluginProviderHandler.disable(input);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Plugin not found or already disabled",
			});
		}
		return { success };
	}),

	// Get plugin details
	get: publicProcedure.input(pluginIdSchema).query(async ({ input }) => {
		const plugin = await pluginProviderHandler.get(input);
		if (!plugin) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Plugin not found",
			});
		}
		return plugin;
	}),

	// List all plugins
	list: publicProcedure.input(booleanSchema).query(({ input }) => {
		return pluginProviderHandler.list(input);
	}),

	// Check for updates for a specific plugin
	checkForUpdates: publicProcedure
		.input(pluginIdSchema)
		.query(async ({ input }) => {
			return pluginProviderHandler.checkForUpdates(input);
		}),

	// Check for updates for all plugins
	checkForUpdatesAll: publicProcedure
		.input(booleanSchema)
		.query(({ input }) => {
			return pluginProviderHandler.checkForUpdatesAll(input);
		}),

	// Update a specific plugin
	update: publicProcedure.input(pluginIdSchema).mutation(async ({ input }) => {
		const success = await pluginProviderHandler.update(input);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Plugin not found or no update available",
			});
		}
		return { success };
	}),

	// Update all plugins
	updateAll: publicProcedure.mutation(async () => {
		const updatedPlugins = await pluginProviderHandler.updateAll();
		return { updatedPlugins };
	}),

	// Search across all plugins and flatten all sources
	searchAll: publicProcedure
		.input(z.string().min(1, { message: "Query must not be empty" }))
		.query(async ({ input: query }) => {
			try {
				const os = getOS();
				const plugins = await pluginProviderHandler.list(false);

				if (!plugins.length) {
					return {
						success: false,
						message: "No plugins found",
						data: [],
					};
				}

				const results = await Promise.all(
					plugins.map(async (plugin) => {
						try {
							const configParams = plugin.config
								? plugin.config?.search?.join("/")
								: null;
							const baseUrl = `${plugin.api_url}/search/${os}`;
							const searchUrl = configParams
								? `${baseUrl}/${configParams}/${encodeURIComponent(query)}`
								: `${baseUrl}/${encodeURIComponent(query)}`;

							const res = await fetch(searchUrl);
							const json: PluginSearchResponse[] = res.ok
								? await res.json()
								: [];

							return {
								id: plugin.id,
								name: plugin.name,
								sources: json,
								config: plugin.config,
								multiple_choice: Boolean(plugin?.multiple_choice) ?? false,
							};
						} catch (err) {
							console.error(`Error fetching from plugin ${plugin.id}:`, err);

							return {
								id: plugin.id,
								name: plugin.name,
								sources: [],
								config: plugin.config,
							};
						}
					}),
				);

				return {
					success: true,
					data: results,
				};
			} catch (err) {
				console.error(err);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: (err as Error).message,
				});
			}
		}),
});
