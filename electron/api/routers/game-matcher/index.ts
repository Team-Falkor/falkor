import { publicProcedure, router } from "@backend/api/trpc";
import { GameMatcher } from "@backend/handlers/game-locator/gameMatcher";
import { z } from "zod";

/**
 * Validation schemas
 */
const fileInfoSchema = z.object({
	name: z.string(),
	path: z.string(),
	isDirectory: z.boolean(),
	size: z.number().optional(),
	lastModified: z.date().optional(),
});

const gameMatchOptionsSchema = z.object({
	minConfidence: z.number().min(0).max(1).optional(),
	maxResults: z.number().int().positive().optional(),
	includeAlternativeNames: z.boolean().optional(),
});

const findMatchesInputSchema = z.object({
	gameFile: fileInfoSchema,
	options: gameMatchOptionsSchema.optional().default({}),
});

const getBestMatchInputSchema = z.object({
	gameFile: fileInfoSchema,
	options: gameMatchOptionsSchema.optional().default({}),
});

const findMatchesForFilesInputSchema = z.object({
	gameFiles: z.array(fileInfoSchema),
	options: gameMatchOptionsSchema.optional().default({}),
});

const getBestMatchesInputSchema = z.object({
	gameFiles: z.array(fileInfoSchema),
	options: gameMatchOptionsSchema.optional().default({}),
});

const findMatchesForFilesBatchInputSchema = z.object({
	gameFiles: z.array(fileInfoSchema),
	options: gameMatchOptionsSchema.optional().default({}),
	batchSize: z.number().int().positive().optional().default(5),
});

const confidenceCheckSchema = z.object({
	confidence: z.number().min(0).max(1),
});

// Global GameMatcher instance
let gameMatcherInstance: GameMatcher | null = null;

/**
 * Get or create GameMatcher instance
 */
function getGameMatcherInstance() {
	if (!gameMatcherInstance) {
		gameMatcherInstance = new GameMatcher();
	}
	return gameMatcherInstance;
}

export const gameMatcherRouter = router({
	/**
	 * Find matching games from IGDB based on a local game file
	 */
	findMatches: publicProcedure
		.input(findMatchesInputSchema)
		.mutation(async ({ input }) => {
			const matcher = getGameMatcherInstance();

			try {
				const matches = await matcher.findMatches(
					input.gameFile,
					input.options,
				);
				return {
					success: true,
					data: matches,
				};
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Unknown error occurred",
				};
			}
		}),

	/**
	 * Get the best match for a game file
	 */
	getBestMatch: publicProcedure
		.input(getBestMatchInputSchema)
		.mutation(async ({ input }) => {
			const matcher = getGameMatcherInstance();

			try {
				const bestMatch = await matcher.getBestMatch(
					input.gameFile,
					input.options,
				);
				return {
					success: true,
					data: bestMatch,
				};
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Unknown error occurred",
				};
			}
		}),

	/**
	 * Check if a match is confident enough for auto-addition
	 */
	isAutoAddCandidate: publicProcedure
		.input(confidenceCheckSchema)
		.query(async ({ input }) => {
			const matcher = getGameMatcherInstance();
			const isAutoAdd = matcher.isAutoAddCandidate(input.confidence);
			return {
				isAutoAddCandidate: isAutoAdd,
				confidence: input.confidence,
			};
		}),

	/**
	 * Check if a match requires user selection
	 */
	requiresUserSelection: publicProcedure
		.input(confidenceCheckSchema)
		.query(async ({ input }) => {
			const matcher = getGameMatcherInstance();
			const requiresSelection = matcher.requiresUserSelection(input.confidence);
			return {
				requiresUserSelection: requiresSelection,
				confidence: input.confidence,
			};
		}),

	/**
	 * Get default matching options
	 */
	getDefaultOptions: publicProcedure.query(async () => {
		return {
			minConfidence: 0.6,
			maxResults: 10,
			includeAlternativeNames: true,
		};
	}),

	/**
	 * Find matching games for multiple game files
	 */
	findMatchesForFiles: publicProcedure
		.input(findMatchesForFilesInputSchema)
		.mutation(async ({ input }) => {
			const matcher = getGameMatcherInstance();

			try {
				const results = await matcher.findMatchesForFiles(
					input.gameFiles,
					input.options,
				);
				return {
					success: true,
					data: results,
				};
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Unknown error occurred",
				};
			}
		}),

	/**
	 * Get the best matches for multiple game files
	 */
	getBestMatches: publicProcedure
		.input(getBestMatchesInputSchema)
		.mutation(async ({ input }) => {
			const matcher = getGameMatcherInstance();

			try {
				const results = await matcher.getBestMatches(
					input.gameFiles,
					input.options,
				);
				return {
					success: true,
					data: results,
				};
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Unknown error occurred",
				};
			}
		}),

	/**
	 * Find matches for multiple files with batch processing
	 */
	findMatchesForFilesBatch: publicProcedure
		.input(findMatchesForFilesBatchInputSchema)
		.mutation(async ({ input }) => {
			const matcher = getGameMatcherInstance();

			try {
				const results = await matcher.findMatchesForFilesBatch(
					input.gameFiles,
					input.options,
					input.batchSize,
				);
				return {
					success: true,
					data: results,
				};
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Unknown error occurred",
				};
			}
		}),

	/**
	 * Reset the GameMatcher instance
	 */
	resetInstance: publicProcedure.mutation(async () => {
		gameMatcherInstance = null;
		return {
			success: true,
			message: "GameMatcher instance reset",
		};
	}),
});
