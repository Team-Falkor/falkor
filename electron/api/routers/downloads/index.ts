import { DebridManager } from "@backend/handlers/debrid-manager";
import { DebridCachingManager } from "@backend/handlers/debrid-manager/debridCachingManager";
import { debridCachingItems } from "@backend/handlers/debrid-manager/map";
import { httpDownloadHandler } from "@backend/handlers/downloads/http";
import { torrentDownloadHandler } from "@backend/handlers/downloads/torrent";
import pluginProviderHandler from "@backend/handlers/plugins/providers/handler";
import { getErrorMessage } from "@backend/utils/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import { downloadQueue } from "../../../handlers/downloads/queue";
import { pluginIdSchema } from "../plugins/providers";

downloadQueue.registerHandler("http", httpDownloadHandler);
downloadQueue.registerHandler("torrent", torrentDownloadHandler);

const gameDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	image_id: z.string(),
	banner_id: z.string().optional(),
});

export const addDownloadSchema = z.object({
	url: z.string(),
	multiple_choice: z.boolean().default(false),
	pluginId: pluginIdSchema.optional(),
	type: z.enum(["http", "torrent"]),
	name: z.string().optional(),
	path: z.string().optional(),
	priority: z.enum(["high", "normal", "low"]).optional(),
	game_data: gameDataSchema.optional(),
	autoStart: z.boolean().optional(),
});

const downloadIdSchema = z.object({
	id: z.string().uuid(),
});

const prioritySchema = z.object({
	id: z.string().uuid(),
	priority: z.enum(["high", "normal", "low"]),
});

const configSchema = z.object({
	maxConcurrentDownloads: z.number().min(1).optional(),
	maxRetries: z.number().min(0).optional(),
	retryDelay: z.number().min(0).optional(),
	persistQueue: z.boolean().optional(),
});

const debridManager = DebridManager.getInstance();

export const downloadQueueRouter = router({
	add: publicProcedure.input(addDownloadSchema).mutation(async ({ input }) => {
		try {
			let finalUrl = input.url;

			const isPluginLookupRequired = input.multiple_choice;
			if (isPluginLookupRequired && input.pluginId) {
				const plugin = await pluginProviderHandler.get(input.pluginId);

				if (plugin?.api_url) {
					const response = await fetch(`${plugin.api_url}/return/${input.url}`);
					const resolvedUrls: string[] = await response.json();

					if (response.ok && resolvedUrls.length > 0) {
						finalUrl = resolvedUrls[0];
					}
				}
			}

			let payload: z.infer<typeof addDownloadSchema> = {
				...input,
				url: finalUrl,
			};

			const isDirectHttp = input.type === "http";
			const debrid = await debridManager.download(
				finalUrl,
				isDirectHttp ? "ddl" : "torrent",
			);

			if (debrid?.isCaching) {
				// add to a cache queue that will check on an interval to see if the status has changed and once its changed in that interval add to the download queue and remove from the cache queue
				const item = new DebridCachingManager({
					inputFromAddDownload: payload,
					url: payload.url,
					type: payload.type,
					id: payload.url,
				});

				debridCachingItems.set(payload.url, item);
				item.start();

				return { id: payload.url, isCaching: true };
			}

			if (debrid?.url) {
				payload = {
					...payload,
					url: debrid.url,
					type: "http",
				};
			}

			const id = await downloadQueue.addDownload(payload);
			return { id, isCaching: false };
		} catch (err) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: getErrorMessage(err, "Failed to add download"),
			});
		}
	}),

	getCachingItems: publicProcedure.query(() => {
		const items = Array.from(debridCachingItems.values());
		if (!items?.length) return [];
		return items.map((item) => item.getStats());
	}),

	pause: publicProcedure.input(downloadIdSchema).mutation(async ({ input }) => {
		const success = await downloadQueue.pauseDownload(input.id);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Download not found or not in a pausable state",
			});
		}
		return { success };
	}),

	resume: publicProcedure.input(downloadIdSchema).mutation(({ input }) => {
		const success = downloadQueue.resumeDownload(input.id);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Download not found or not in a resumable state",
			});
		}
		return { success };
	}),

	cancel: publicProcedure.input(downloadIdSchema).mutation(({ input }) => {
		const success = downloadQueue.cancelDownload(input.id);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Download not found",
			});
		}
		return { success };
	}),

	remove: publicProcedure.input(downloadIdSchema).mutation(({ input }) => {
		const success = downloadQueue.removeDownload(input.id);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Download not found",
			});
		}
		return { success };
	}),

	clearCompleted: publicProcedure.mutation(() => {
		const count = downloadQueue.clearCompletedDownloads();
		return { count };
	}),

	getAll: publicProcedure.query(() => {
		return downloadQueue.getDownloads();
	}),

	getById: publicProcedure.input(downloadIdSchema).query(({ input }) => {
		const download = downloadQueue.getDownload(input.id);
		if (!download) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Download not found",
			});
		}
		return download;
	}),

	setPriority: publicProcedure.input(prioritySchema).mutation(({ input }) => {
		const success = downloadQueue.setPriority(input.id, input.priority);
		if (!success) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Download not found",
			});
		}
		return { success };
	}),

	updateConfig: publicProcedure.input(configSchema).mutation(({ input }) => {
		downloadQueue.updateConfig(input);
		return { success: true };
	}),
});
