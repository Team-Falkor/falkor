import * as fs from "node:fs";
import * as path from "node:path";
import * as zip from "@zip.js/zip.js";
import { type ArcFile, createExtractorFromData } from "node-unrar-js";

/**
 * Progress details reported during archive extraction.
 */
export interface ArchiveProgress {
	/** Total number of entries (if known). */
	totalEntries?: number;
	/** Number of entries processed so far. */
	processedEntries?: number;
	/** Extraction progress as a percentage (0–100). */
	percent: number;
	/** Currently extracted file name. */
	currentFile: string;
}

/**
 * Options for configuring an archive extraction.
 */
export interface ArchiveHandlerOptions {
	/** Path to the archive file (.zip or .rar). */
	inputFile: string;
	/** Optional target directory. Defaults to basename of archive. */
	outputDir?: string;
	/** Progress callback triggered on each file. */
	onProgress?: (progress: ArchiveProgress) => void;
}

/**
 * Handles extracting .zip and .rar files using pure JavaScript implementations.
 */
export class ArchiveHandler {
	private options: ArchiveHandlerOptions;

	constructor(options: ArchiveHandlerOptions) {
		this.options = options;
	}

	/**
	 * Extracts a .zip file using @zip.js/zip.js.
	 * Preserves directory structure and reports progress.
	 */
	public async unzip(): Promise<void> {
		const { inputFile, outputDir, onProgress } = this.options;

		const outputDirectory =
			outputDir ||
			path.join(path.dirname(inputFile), path.basename(inputFile, ".zip"));

		await fs.promises.mkdir(outputDirectory, { recursive: true });

		const fileBuffer = fs.readFileSync(inputFile);
		const reader = new zip.ZipReader(
			new zip.BlobReader(new Blob([fileBuffer])),
		);
		const entries = await reader.getEntries();
		const totalEntries = entries.length;

		for (let i = 0; i < totalEntries; i++) {
			const entry = entries[i];
			const outputPath = path.join(outputDirectory, entry.filename);

			// Report current progress
			onProgress?.({
				totalEntries,
				processedEntries: i + 1,
				percent: ((i + 1) / totalEntries) * 100,
				currentFile: entry.filename,
			});

			if (entry.directory) {
				await fs.promises.mkdir(outputPath, { recursive: true });
				continue;
			}

			await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

			if (entry.getData) {
				const writer = new zip.BlobWriter();
				const data = await entry.getData(writer);

				if (data) {
					const buffer = await data.arrayBuffer();
					await fs.promises.writeFile(outputPath, Buffer.from(buffer));
				}
			}
		}

		await reader.close();
	}

	/**
	 * Extracts a .rar file using node-unrar-js.
	 * This library is a WASM-backed implementation and doesn’t require native binaries.
	 * Throws if archive can't be read.
	 */
	public async unrar(): Promise<void> {
		const { inputFile, outputDir, onProgress } = this.options;

		const outputDirectory =
			outputDir ||
			path.join(path.dirname(inputFile), path.basename(inputFile, ".rar"));

		await fs.promises.mkdir(outputDirectory, { recursive: true });

		const rarBuffer = await fs.promises.readFile(inputFile);
		const extractor = await createExtractorFromData({
			data: new Uint8Array(rarBuffer).buffer,
			// Add password here if needed in the future
		});

		// Fully consume the generator to prevent memory issues.
		const extractedFiles: ArcFile<Uint8Array>[] = [
			...extractor.extract().files,
		];

		const totalEntries = extractedFiles.length;

		if (totalEntries === 0) {
			onProgress?.({
				percent: 100,
				currentFile: "No files to extract or empty archive.",
			});
			return;
		}

		for (let i = 0; i < totalEntries; i++) {
			const file = extractedFiles[i];
			const filename = file.fileHeader.name;
			const outputPath = path.join(outputDirectory, filename);

			// Update progress per file
			onProgress?.({
				totalEntries,
				processedEntries: i + 1,
				percent: ((i + 1) / totalEntries) * 100,
				currentFile: filename,
			});

			if (file.fileHeader.flags.directory) {
				await fs.promises.mkdir(outputPath, { recursive: true });
			} else {
				await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

				if (file.extraction) {
					await fs.promises.writeFile(outputPath, Buffer.from(file.extraction));
				} else {
					console.warn(`Warning: Skipped ${filename}, no file data.`);
				}
			}
		}

		onProgress?.({
			percent: 100,
			currentFile: "RAR extraction complete.",
		});
	}
}
