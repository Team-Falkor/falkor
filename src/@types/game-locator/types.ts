export interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size?: number;
	lastModified?: Date;
}

export interface ScanOptions {
	extraSkipFolders?: string[];
	minFileSize?: number;
	maxFileSize?: number;
	maxDepth?: number;
	timeout?: number;
	concurrency?: number;
}

export interface ScanStats {
	processedDirs: number;
	processedFiles: number;
	skippedPaths: number;
	errors: number;
	gamesFound: number;
}

export interface ScanResult {
	games: FileInfo[];
	stats: ScanStats;
	duration: number;
	success: boolean;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}
