import path from "node:path";
import type { FileInfo, IGDBReturnDataType } from "@/@types";
import { IGDBWrapper } from "../api-wrappers/igdb";

export interface GameMatchResult {
	game: IGDBReturnDataType;
	confidence: number;
	reason: string;
}

export interface GameFileMatchResult {
	file: FileInfo;
	matches: GameMatchResult[];
	bestMatch: GameMatchResult | null;
}

export interface GameMatchOptions {
	minConfidence?: number;
	maxResults?: number;
	includeAlternativeNames?: boolean;
}

export class GameMatcher {
	private igdbWrapper: IGDBWrapper;
	private readonly DEFAULT_MIN_CONFIDENCE = 0.6;
	private readonly DEFAULT_MAX_RESULTS = 10;

	constructor() {
		this.igdbWrapper = IGDBWrapper.getInstance();
	}

	/**
	 * Find matching games from IGDB based on a local game file
	 * @param gameFile - The local game file to match
	 * @param options - Matching options
	 * @returns Array of potential matches with confidence scores
	 */
	async findMatches(
		gameFile: FileInfo,
		options: GameMatchOptions = {},
	): Promise<GameMatchResult[]> {
		const {
			minConfidence = this.DEFAULT_MIN_CONFIDENCE,
			maxResults = this.DEFAULT_MAX_RESULTS,
		} = options;

		// Extract game name from file path and name
		const searchQueries = this.extractSearchQueries(gameFile);
		const allMatches: GameMatchResult[] = [];

		// Search for each query
		for (const query of searchQueries) {
			try {
				const searchResults = await this.igdbWrapper.search(query, maxResults);

				for (const game of searchResults) {
					const confidence = this.calculateConfidence(gameFile, game, query);

					if (confidence >= minConfidence) {
						allMatches.push({
							game,
							confidence,
							reason: this.getMatchReason(gameFile, game, query, confidence),
						});
					}
				}
			} catch (error) {
				console.warn(`Failed to search for "${query}":`, error);
			}
		}

		// Remove duplicates and sort by confidence
		const uniqueMatches = this.removeDuplicates(allMatches);
		return uniqueMatches
			.sort((a, b) => b.confidence - a.confidence)
			.slice(0, maxResults);
	}

	/**
	 * Get the best match for a game file
	 * @param gameFile - The local game file to match
	 * @param options - Matching options
	 * @returns The best match or null if no good match found
	 */
	async getBestMatch(
		gameFile: FileInfo,
		options: GameMatchOptions = {},
	): Promise<GameMatchResult | null> {
		const matches = await this.findMatches(gameFile, options);
		return matches.length > 0 ? matches[0] : null;
	}

	/**
	 * Check if a match is confident enough for auto-addition
	 * @param confidence - The confidence score
	 * @returns True if confident enough for auto-addition
	 */
	isAutoAddCandidate(confidence: number): boolean {
		return confidence >= 0.85;
	}

	/**
	 * Check if a match requires user selection
	 * @param confidence - The confidence score
	 * @returns True if user selection is recommended
	 */
	requiresUserSelection(confidence: number): boolean {
		return confidence >= 0.4 && confidence < 0.85;
	}

	/**
	 * Find matching games for multiple game files
	 * @param gameFiles - Array of local game files to match
	 * @param options - Matching options
	 * @returns Array of results for each file with their matches
	 */
	async findMatchesForFiles(
		gameFiles: FileInfo[],
		options: GameMatchOptions = {},
	): Promise<GameFileMatchResult[]> {
		const results: GameFileMatchResult[] = [];

		for (const file of gameFiles) {
			try {
				const matches = await this.findMatches(file, options);
				const bestMatch = matches.length > 0 ? matches[0] : null;

				results.push({
					file,
					matches,
					bestMatch,
				});
			} catch (error) {
				console.warn(`Failed to find matches for "${file.name}":`, error);
				results.push({
					file,
					matches: [],
					bestMatch: null,
				});
			}
		}

		return results;
	}

	/**
	 * Get the best matches for multiple game files
	 * @param gameFiles - Array of local game files to match
	 * @param options - Matching options
	 * @returns Array of best matches for each file (null if no good match found)
	 */
	async getBestMatches(
		gameFiles: FileInfo[],
		options: GameMatchOptions = {},
	): Promise<(GameMatchResult | null)[]> {
		const results: (GameMatchResult | null)[] = [];

		for (const file of gameFiles) {
			try {
				const bestMatch = await this.getBestMatch(file, options);
				results.push(bestMatch);
			} catch (error) {
				console.warn(`Failed to find best match for "${file.name}":`, error);
				results.push(null);
			}
		}

		return results;
	}

	/**
	 * Find matches for multiple files with batch processing for better performance
	 * @param gameFiles - Array of local game files to match
	 * @param options - Matching options
	 * @param batchSize - Number of files to process concurrently (default: 5)
	 * @returns Array of results for each file with their matches
	 */
	async findMatchesForFilesBatch(
		gameFiles: FileInfo[],
		options: GameMatchOptions = {},
		batchSize = 5,
	): Promise<GameFileMatchResult[]> {
		const results: GameFileMatchResult[] = [];

		// Process files in batches to avoid overwhelming the API
		for (let i = 0; i < gameFiles.length; i += batchSize) {
			const batch = gameFiles.slice(i, i + batchSize);
			const batchPromises = batch.map(async (file) => {
				try {
					const matches = await this.findMatches(file, options);
					const bestMatch = matches.length > 0 ? matches[0] : null;

					return {
						file,
						matches,
						bestMatch,
					};
				} catch (error) {
					console.warn(`Failed to find matches for "${file.name}":`, error);
					return {
						file,
						matches: [],
						bestMatch: null,
					};
				}
			});

			const batchResults = await Promise.all(batchPromises);
			results.push(...batchResults);
		}

		return results;
	}

	/**
	 * Extract potential search queries from a game file
	 */
	private extractSearchQueries(gameFile: FileInfo): string[] {
		const queries: string[] = [];
		const fileName = path.basename(gameFile.name, path.extname(gameFile.name));
		const pathParts = gameFile.path.split(path.sep);

		// Clean up the filename
		const cleanFileName = this.cleanGameName(fileName);
		if (cleanFileName) {
			queries.push(cleanFileName);
		}

		// Extract from parent directory names
		for (let i = pathParts.length - 2; i >= 0; i--) {
			const dirName = this.cleanGameName(pathParts[i]);
			if (
				dirName &&
				dirName !== cleanFileName &&
				this.isLikelyGameName(dirName)
			) {
				queries.push(dirName);
				break; // Only take the most immediate parent that looks like a game name
			}
		}

		return [...new Set(queries)]; // Remove duplicates
	}

	/**
	 * Clean a potential game name for searching
	 */
	private cleanGameName(name: string): string {
		return (
			name
				// Remove common patterns
				.replace(/[[(].*?[\])]/g, "") // Remove content in brackets/parentheses
				.replace(
					/\b(setup|install|launcher|game|exe|v?\d+\.\d+.*|\d{4})\b/gi,
					"",
				) // Remove common words and versions
				.replace(/[_\-.]+/g, " ") // Replace separators with spaces
				.replace(/\s+/g, " ") // Normalize whitespace
				.trim()
		);
	}

	/**
	 * Check if a string looks like a game name
	 */
	private isLikelyGameName(name: string): boolean {
		const cleaned = name.toLowerCase();

		// Skip obvious non-game directories
		const skipPatterns = [
			"bin",
			"data",
			"config",
			"save",
			"saves",
			"temp",
			"cache",
			"log",
			"logs",
			"backup",
			"common",
			"shared",
			"system",
			"program files",
			"steam",
			"steamapps",
			"epic games",
		];

		return (
			!skipPatterns.some((pattern) => cleaned.includes(pattern)) &&
			cleaned.length > 2 &&
			!/^\d+$/.test(cleaned)
		); // Not just numbers
	}

	/**
	 * Calculate confidence score for a match
	 */
	private calculateConfidence(
		gameFile: FileInfo,
		igdbGame: IGDBReturnDataType,
		query: string,
	): number {
		let confidence = 0;
		const gameName = igdbGame.name?.toLowerCase() || "";
		const queryLower = query.toLowerCase();
		const fileName = path
			.basename(gameFile.name, path.extname(gameFile.name))
			.toLowerCase();

		// Exact name match
		if (gameName === queryLower) {
			confidence += 0.5;
		}
		// Partial name match
		else if (gameName.includes(queryLower) || queryLower.includes(gameName)) {
			confidence += 0.3;
		}
		// Fuzzy match using Levenshtein-like similarity
		else {
			const similarity = this.calculateStringSimilarity(gameName, queryLower);
			confidence += similarity * 0.4;
		}

		// Bonus for file name similarity
		const fileNameSimilarity = this.calculateStringSimilarity(
			gameName,
			fileName,
		);
		confidence += fileNameSimilarity * 0.2;

		// Bonus for having a good rating (indicates it's a real game)
		if (igdbGame.aggregated_rating && igdbGame.aggregated_rating > 70) {
			confidence += 0.1;
		}

		// Bonus for recent games (more likely to be what user is looking for)
		if (igdbGame.first_release_date) {
			const releaseYear = new Date(
				igdbGame.first_release_date * 1000,
			).getFullYear();
			const currentYear = new Date().getFullYear();
			if (currentYear - releaseYear < 10) {
				confidence += 0.05;
			}
		}

		// Penalty for very short names (often false positives)
		if (gameName.length < 3) {
			confidence -= 0.2;
		}

		return Math.min(1, Math.max(0, confidence));
	}

	/**
	 * Calculate string similarity using a simple algorithm
	 */
	private calculateStringSimilarity(str1: string, str2: string): number {
		if (str1 === str2) return 1;
		if (str1.length === 0 || str2.length === 0) return 0;

		// Simple character-based similarity
		const longer = str1.length > str2.length ? str1 : str2;
		const shorter = str1.length > str2.length ? str2 : str1;

		if (longer.length === 0) return 1;

		const editDistance = this.levenshteinDistance(longer, shorter);
		return (longer.length - editDistance) / longer.length;
	}

	/**
	 * Calculate Levenshtein distance between two strings
	 */
	private levenshteinDistance(str1: string, str2: string): number {
		const matrix = [];

		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= str1.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1,
					);
				}
			}
		}

		return matrix[str2.length][str1.length];
	}

	/**
	 * Get a human-readable reason for the match
	 */
	private getMatchReason(
		_gameFile: FileInfo,
		igdbGame: IGDBReturnDataType,
		_query: string,
		confidence: number,
	): string {
		const gameName = igdbGame.name || "Unknown";

		if (confidence >= 0.9) {
			return `Exact match for "${gameName}"`;
		}
		if (confidence >= 0.7) {
			return `Strong match for "${gameName}"`;
		}
		if (confidence >= 0.5) {
			return `Good match for "${gameName}"`;
		}
		return `Possible match for "${gameName}"`;
	}

	/**
	 * Remove duplicate games from matches
	 */
	private removeDuplicates(matches: GameMatchResult[]): GameMatchResult[] {
		const seen = new Set<number>();
		return matches.filter((match) => {
			if (seen.has(match.game.id)) {
				return false;
			}
			seen.add(match.game.id);
			return true;
		});
	}
}
