import * as fs from "node:fs";
import * as path from "node:path";
import * as zip from "@zip.js/zip.js";

/**
 * Tracks the state of the unzip process.
 */
export interface UnzipProgress {
	totalEntries: number;
	processedEntries: number;
	percent: number;
	currentFile: string;
}

/**
 * Configuration for the Unzipper.
 */
export interface UnzipperOptions {
	/** Path to the .zip file. */
	inputFile: string;
	/** Optional output directory; defaults to zip filename without extension. */
	outputDir?: string;
	/** Callback for reporting progress during extraction. */
	onProgress?: (progress: UnzipProgress) => void;
}

/**
 * Extracts a zip archive with optional progress reporting.
 */
export class UnzipHandler {
	private options: UnzipperOptions;

	constructor(options: UnzipperOptions) {
		this.options = options;
	}

	/**
	 * Extracts the archive to the target directory.
	 */
	public async unzip(): Promise<void> {
		const { inputFile, outputDir, onProgress } = this.options;

		const outputDirectory =
			outputDir ||
			path.join(path.dirname(inputFile), path.basename(inputFile, ".zip"));

		if (!fs.existsSync(outputDirectory)) {
			fs.mkdirSync(outputDirectory, { recursive: true });
		}

		const fileBuffer = fs.readFileSync(inputFile);
		const reader = new zip.ZipReader(
			new zip.BlobReader(new Blob([fileBuffer])),
		);
		const entries = await reader.getEntries();
		const totalEntries = entries.length;

		for (let i = 0; i < totalEntries; i++) {
			const entry = entries[i];
			const outputPath = path.join(outputDirectory, entry.filename);

			onProgress?.({
				totalEntries,
				processedEntries: i + 1,
				percent: ((i + 1) / totalEntries) * 100,
				currentFile: entry.filename,
			});

			if (entry.directory) {
				if (!fs.existsSync(outputPath)) {
					fs.mkdirSync(outputPath, { recursive: true });
				}
				continue;
			}

			if (entry.getData) {
				const parentDir = path.dirname(outputPath);
				if (!fs.existsSync(parentDir)) {
					fs.mkdirSync(parentDir, { recursive: true });
				}

				const writer = new zip.BlobWriter();
				const data = await entry.getData(writer);
				if (data) {
					const buffer = await data.arrayBuffer();
					fs.writeFileSync(outputPath, Buffer.from(buffer));
				}
			}
		}

		await reader.close();
	}
}
