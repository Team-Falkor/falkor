import { homedir, platform } from "node:os";
import path from "node:path";
import { normalizePath } from "../utils/pathUtils";

const commonSkipFolders: string[] = [
	// Windows system folders
	"C:/Windows/System32",
	"C:/Windows/SysWOW64",
	"C:/Windows/WinSxS",
	"C:/Windows/Boot",
	"C:/Windows/Resources",
	"C:/Windows/servicing",
	"C:/Windows/SystemApps",
	"C:/PerfLogs",
	"C:/Recovery",

	// Recycle bins and system volumes
	"$Recycle.Bin",
	"System Volume Information",
	"$dot_Recycle.Bin$",

	// macOS system folders
	"/System",
	"/Library/Application Support",
	"/Library/Caches",
	"/Library/Logs",
	"/cores",
	"/private/var",
	"/private/tmp",
	"/.Spotlight-V100",
	"/.Trashes",
	"/.fseventsd",

	// Linux system folders
	"/bin",
	"/boot",
	"/dev",
	"/etc",
	"/lib",
	"/lib64",
	"/media",
	"/mnt",
	"/proc",
	"/root",
	"/run",
	"/sbin",
	"/srv",
	"/sys",
	"/tmp",
	"/var/log",
	"/var/cache",
	"/var/tmp",

	// Common development and cache folders
	"node_modules",
	".git",
	".svn",
	".hg",
	"$dot_git$",
	"$dot_svn$",
	"$dot_hg$",

	// Browser caches and temp folders
	"AppData/Local/Temp",
	"AppData/Local/Google/Chrome/User Data",
	"AppData/Local/Microsoft/Edge/User Data",
	"AppData/Local/Mozilla/Firefox",
	".cache",
	".tmp",
];

export const getSkipFolders = (extraSkipFolders: string[] = []): string[] => {
	const currentPlatform = platform();
	const userHome = homedir();
	const foldersToSkip: string[] = [];

	const normalizedCommonSkipFolders = commonSkipFolders.map((folder) =>
		normalizePath(folder),
	);

	if (currentPlatform === "win32") {
		// More targeted Windows exclusions
		foldersToSkip.push(
			// System folders only
			normalizePath("C:\\Windows\\System32"),
			normalizePath("C:\\Windows\\SysWOW64"),
			normalizePath("C:\\Windows\\WinSxS"),
			normalizePath("C:\\Windows\\servicing"),
			normalizePath("C:\\Windows\\SystemApps"),

			// Only specific subfolders of Program Files that are unlikely to contain games
			normalizePath("C:\\Program Files\\Windows Defender"),
			normalizePath("C:\\Program Files\\Windows Mail"),
			normalizePath("C:\\Program Files\\Windows Media Player"),
			normalizePath("C:\\Program Files\\Windows NT"),
			normalizePath("C:\\Program Files\\Windows Photo Viewer"),
			normalizePath("C:\\Program Files\\Windows Portable Devices"),
			normalizePath("C:\\Program Files\\Windows Security"),
			normalizePath("C:\\Program Files\\WindowsApps"),

			// Specific temp and cache folders, not entire AppData
			normalizePath(path.join(userHome, "AppData", "Local", "Temp")),
			normalizePath(
				path.join(
					userHome,
					"AppData",
					"Local",
					"Microsoft",
					"Windows",
					"INetCache",
				),
			),
			normalizePath(path.join(userHome, "AppData", "Local", "CrashDumps")),
			normalizePath(process.env.TEMP || ""),
			normalizePath(process.env.TMP || ""),

			// System-wide temp, not user areas
			normalizePath("C:\\Windows\\Temp"),
			normalizePath("C:\\Temp"),
		);
	} else if (currentPlatform === "darwin") {
		// macOS exclusions - be more specific
		foldersToSkip.push(
			normalizePath("/System"),
			normalizePath("/Library/Caches"),
			normalizePath("/Library/Logs"),
			normalizePath("/private/var"),
			normalizePath("/private/tmp"),
			normalizePath("/Volumes"), // External drives are often mounted here

			// User-specific caches, not entire Library
			normalizePath(path.join(userHome, "Library", "Caches")),
			normalizePath(path.join(userHome, "Library", "Logs")),
			normalizePath(
				path.join(userHome, "Library", "Application Support", "CrashReporter"),
			),
		);
	} else if (currentPlatform === "linux") {
		// Linux exclusions
		foldersToSkip.push(
			normalizePath("/bin"),
			normalizePath("/boot"),
			normalizePath("/dev"),
			normalizePath("/etc"),
			normalizePath("/lib"),
			normalizePath("/lib64"),
			normalizePath("/proc"),
			normalizePath("/run"),
			normalizePath("/sbin"),
			normalizePath("/sys"),
			normalizePath("/var/log"),
			normalizePath("/var/cache"),
			normalizePath("/var/tmp"),

			// User cache, not entire home subfolders
			normalizePath(path.join(userHome, ".cache")),
			normalizePath(path.join(userHome, ".local", "share", "Trash")),
		);
	}

	const normalizedExtraSkipFolders = extraSkipFolders.map((folder) =>
		normalizePath(folder),
	);

	const finalSkipFolders = new Set([
		...normalizedCommonSkipFolders,
		...foldersToSkip,
		...normalizedExtraSkipFolders,
	]);

	return Array.from(finalSkipFolders);
};

const memoizedSkipFoldersMap = new Map<string, string[]>();

export const getMemoizedSkipFolders = (
	extraSkipFolders: string[] = [],
): string[] => {
	const key = extraSkipFolders.sort().join(",");
	if (memoizedSkipFoldersMap.has(key)) {
		return memoizedSkipFoldersMap.get(key) ?? [];
	}
	const result = getSkipFolders(extraSkipFolders);
	memoizedSkipFoldersMap.set(key, result);
	return result;
};

export const shouldSkipPath = (
	filePath: string,
	extraSkipFolders: string[] = [],
): boolean => {
	const normalizedFilePath = normalizePath(filePath);
	const skipFolders = getMemoizedSkipFolders(extraSkipFolders);

	// Check if the path starts with any skip folder
	for (const skipFolder of skipFolders) {
		if (normalizedFilePath.startsWith(skipFolder)) {
			return true;
		}
	}

	// Additional check for common system patterns that might not be in the list
	if (isSystemPath(normalizedFilePath)) {
		return true;
	}

	return false;
};

// Helper function to identify system paths that should be skipped
const isSystemPath = (normalizedPath: string): boolean => {
	const systemPatterns = [
		// Windows system patterns
		/^C:\/Windows\/System32/i,
		/^C:\/Windows\/SysWOW64/i,
		/^C:\/Windows\/WinSxS/i,
		/\/\$Recycle\.Bin/i,
		/\/System Volume Information/i,

		// Browser cache patterns
		/\/Google\/Chrome\/User Data\/.*\/Cache/i,
		/\/Mozilla\/Firefox\/Profiles\/.*\/cache/i,
		/\/Microsoft\/Edge\/User Data\/.*\/Cache/i,

		// Development patterns
		/\/node_modules\//i,
		/\/\.git\//i,
		/\/\.svn\//i,

		// Temporary patterns
		/\/Temp\//i,
		/\/tmp\//i,
		/\/cache\//i,
	];

	return systemPatterns.some((pattern) => pattern.test(normalizedPath));
};

// Function to get common game directories that should NOT be skipped
export const getCommonGameDirectories = (): string[] => {
	const currentPlatform = platform();
	const userHome = homedir();
	const commonGamePaths: string[] = [];

	if (currentPlatform === "win32") {
		commonGamePaths.push(
			// User directories
			normalizePath(path.join(userHome, "Desktop")),
			normalizePath(path.join(userHome, "Documents")),
			normalizePath(path.join(userHome, "Downloads")),
			normalizePath(path.join(userHome, "Games")),

			// Common game installation directories
			normalizePath("C:\\Games"),
			normalizePath("C:\\Program Files\\Steam"),
			normalizePath("C:\\Program Files (x86)\\Steam"),
			normalizePath("C:\\Program Files\\Epic Games"),
			normalizePath("C:\\Program Files (x86)\\Epic Games"),
			normalizePath("C:\\Program Files\\GOG Galaxy"),
			normalizePath("C:\\Program Files (x86)\\GOG Galaxy"),

			// Steam library folders
			normalizePath("C:\\SteamLibrary"),
			normalizePath("D:\\SteamLibrary"),
			normalizePath("E:\\SteamLibrary"),
		);
	} else if (currentPlatform === "darwin") {
		commonGamePaths.push(
			normalizePath(path.join(userHome, "Desktop")),
			normalizePath(path.join(userHome, "Documents")),
			normalizePath(path.join(userHome, "Downloads")),
			normalizePath(path.join(userHome, "Games")),
			normalizePath("/Applications"),
			normalizePath(path.join(userHome, "Applications")),
		);
	} else if (currentPlatform === "linux") {
		commonGamePaths.push(
			normalizePath(path.join(userHome, "Desktop")),
			normalizePath(path.join(userHome, "Documents")),
			normalizePath(path.join(userHome, "Downloads")),
			normalizePath(path.join(userHome, "Games")),
			normalizePath(path.join(userHome, ".steam")),
			normalizePath(path.join(userHome, ".local", "share", "Steam")),
			normalizePath("/opt"),
			normalizePath("/usr/games"),
		);
	}

	return commonGamePaths;
};
