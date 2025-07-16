import type { ScanOptions, ValidationResult } from "@/@types";

export const validateScanOptions = (options: ScanOptions): ValidationResult => {
	const errors: string[] = [];

	if (options.minFileSize !== undefined && options.minFileSize < 0) {
		errors.push("minFileSize must be non-negative");
	}

	if (options.maxFileSize !== undefined && options.maxFileSize < 0) {
		errors.push("maxFileSize must be non-negative");
	}

	if (
		options.minFileSize !== undefined &&
		options.maxFileSize !== undefined &&
		options.minFileSize > options.maxFileSize
	) {
		errors.push("minFileSize cannot be greater than maxFileSize");
	}

	if (options.maxDepth !== undefined && options.maxDepth < 1) {
		errors.push("maxDepth must be at least 1");
	}

	if (options.concurrency !== undefined && options.concurrency < 1) {
		errors.push("concurrency must be at least 1");
	}

	if (options.extraSkipFolders) {
		for (const folder of options.extraSkipFolders) {
			if (typeof folder !== "string" || folder.trim() === "") {
				errors.push("extraSkipFolders must contain non-empty strings");
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};
