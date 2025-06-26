import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import Logger from "../../../handlers/logging";

export const loggingRouter = router({
	// Get all logs
	getLogs: publicProcedure.query(() => {
		return Logger.read();
	}),

	// Get log statistics
	getStats: publicProcedure.query(() => {
		return Logger.getStats();
	}),

	// Get logged dates
	getLoggedDates: publicProcedure
		.input(
			z.object({
				includeTime: z.boolean().optional(),
			}),
		)
		.query(({ input }) => {
			return Logger.getLoggedDates(input.includeTime);
		}),

	// Filter logs
	filterLogs: publicProcedure
		.input(
			z.object({
				date: z.date().optional(),
				level: z.enum(["error", "warn", "info", "debug", "trace"]).optional(),
			}),
		)
		.query(({ input }) => {
			return Logger.filter(input);
		}),

	// Advanced filter logs
	advancedFilterLogs: publicProcedure
		.input(
			z.object({
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				levels: z
					.array(z.enum(["error", "warn", "info", "debug", "trace"]))
					.optional(),
				searchText: z.string().optional(),
			}),
		)
		.query(({ input }) => {
			return Logger.advancedFilter(input);
		}),

	getLoggerDates: publicProcedure.query(() => {
		return Logger.getLoggedDates();
	}),

	// Add new log
	addLog: publicProcedure
		.input(
			z.object({
				level: z.enum(["error", "warn", "info", "debug", "trace"]),
				message: z.string(),
			}),
		)
		.mutation(({ input }) => {
			return Logger.log(input.level, input.message);
		}),

	// Clear all logs
	clearLogs: publicProcedure.mutation(async () => {
		try {
			await Logger.clear();
			return { success: true };
		} catch (error) {
			// Convert error to a serializable format
			const errorMessage =
				error instanceof Error ? error.message : "Failed to clear logs";
			throw new Error(errorMessage);
		}
	}),

	// Remove specific log
	removeLog: publicProcedure
		.input(
			z.object({
				timestamp: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				await Logger.remove(input.timestamp);
				return { success: true };
			} catch (error) {
				// Convert error to a serializable format
				const errorMessage =
					error instanceof Error ? error.message : "Failed to remove log";
				throw new Error(errorMessage);
			}
		}),
});
