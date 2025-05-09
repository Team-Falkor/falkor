import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	type DownloadProgress,
	type DownloadStateChange,
	DownloadStatus,
} from "@/@types/download/queue";
import { publicProcedure, router } from "../../../api/trpc";
import { downloadQueue } from "../../../handlers/downloads/queue";
import { emitOnce } from "../../../utils/emit-once";

const gameDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	image_id: z.string(),
	banner_id: z.string().optional(),
});

const addDownloadSchema = z.object({
	url: z.string().url(),
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

export const downloadQueueRouter = router({
	add: publicProcedure.input(addDownloadSchema).mutation(async ({ input }) => {
		try {
			const id = await downloadQueue.addDownload(input);
			return { id };
		} catch (err) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: err instanceof Error ? err.message : "Failed to add download",
			});
		}
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

	subscribeToProgress: publicProcedure
		.input(downloadIdSchema)
		.subscription(async function* ({ input }) {
			try {
				while (true) {
					const download = await emitOnce<DownloadProgress>(
						downloadQueue,
						"progress",
					);
					if (download.id === input.id) {
						yield {
							id: download.id,
							progress: download.progress,
							speed: download.speed,
							timeRemaining: download.timeRemaining,
							status: download.status,
						};
						if (
							download.status === DownloadStatus.COMPLETED ||
							download.status === DownloadStatus.FAILED ||
							download.status === DownloadStatus.CANCELLED
						) {
							break;
						}
					}
				}
			} finally {
				downloadQueue.removeAllListeners("progress");
			}
		}),

	subscribeToStateChanges: publicProcedure.subscription(async function* () {
		try {
			while (true) {
				const download = await emitOnce<DownloadStateChange>(
					downloadQueue,
					"stateChange",
				);
				yield download;
			}
		} finally {
			downloadQueue.removeAllListeners("stateChange");
		}
	}),
});
