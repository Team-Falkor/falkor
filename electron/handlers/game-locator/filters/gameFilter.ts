import path from "node:path";
import type { FileInfo, ScanOptions } from "@/@types";
import { normalizePath } from "../utils/pathUtils";

const EXECUTABLE_EXTENSIONS = new Set([
	"exe",
	"bat",
	"cmd",
	"sh",
	"run",
	"appimage",
	"jar",
	"url",
	"app",
	"deb",
	"rpm",
]);

const GAME_INDICATORS = new Set([
	"game",
	"games",
	"play",
	"launcher",
	"steam",
	"epic",
	"gog",
	"origin",
	"uplay",
	"unity",
	"unreal",
	"godot",
	"rpg",
	"fps",
	"mmo",
	"arcade",
	"puzzle",
	"strategy",
	"simulation",
	"adventure",
	"action",
	"racing",
	"sports",
	"casino",
	"board",
]);

const COMMON_GAME_PATHS = new Set([
	"steam/steamapps",
	"epic games",
	"gog galaxy",
	"origin games",
	"ubisoft game launcher",
	"games",
	"gaming",
]);

const SYSTEM_EXECUTABLES = new Set([
	"system32",
	"syswow64",
	"windows/system32",
	"windows/syswow64",
	"windows",
	"program files/windows",
	"programdata",
	"microsoft",
	"windows defender",
	"windows mail",
	"windows media player",
	"windows nt",
	"windows photo viewer",
	"windows portable devices",
	"windows security",
	"windowsapps",
]);

const DEVELOPMENT_TOOLS = new Set([
	"nodejs",
	"node.exe",
	"npm",
	"yarn",
	"pnpm",
	"bun",
	"git",
	"github",
	"gitkraken",
	"visual studio",
	"vscode",
	"code.exe",
	"cursor",
	"android studio",
	"gradle",
	"kotlin",
	"java",
	"compiler",
	"clang",
	"rust",
	"python",
	"chrome",
	"firefox",
	"edge",
	"browser",
	"updater",
	"installer.exe",
]);

export const isGame = (file: FileInfo, options: ScanOptions = {}): boolean => {
	const { name, isDirectory, size = 0, path: filePath } = file;
	const { minFileSize, maxFileSize } = options; // No defaults - let user control this

	// Basic filters
	if (isDirectory) return false;

	// Size filters - only apply if explicitly set by user
	if (minFileSize !== undefined && size < minFileSize) return false;
	if (maxFileSize !== undefined && size > maxFileSize) return false;

	const extension = getFileExtension(name);
	if (!extension || !EXECUTABLE_EXTENSIONS.has(extension)) return false;

	// Enhanced detection logic
	const normalizedPath = normalizePath(filePath).toLowerCase();
	const normalizedName = name.toLowerCase();
	const fileName = path.basename(normalizedName, path.extname(normalizedName));
	const parentDir = path.dirname(normalizedPath).toLowerCase();

	// Skip obvious system executables
	if (isSystemExecutable(normalizedPath, normalizedName)) {
		return false;
	}

	// Skip development tools
	if (isDevelopmentTool(normalizedPath, normalizedName)) {
		return false;
	}

	// Prioritize files in user directories (Desktop, Documents, Downloads, etc.)
	if (isUserDirectory(parentDir)) {
		return true;
	}

	// Check for game-specific paths
	if (isGamePath(normalizedPath)) {
		return true;
	}

	// Check for game-related keywords in filename
	if (hasGameKeywords(fileName)) {
		return true;
	}

	// Check for common game executable patterns
	if (hasGameExecutablePattern(fileName)) {
		return true;
	}

	// Size-based heuristics for larger files (likely games)
	if (size > 50 * 1024 * 1024) {
		// 50MB+ - could be a game
		return true;
	}

	// For smaller files, be more permissive if they're in reasonable locations
	if (size > 0 && isReasonableGameLocation(normalizedPath)) {
		return true;
	}

	return false;
};

const getFileExtension = (filename: string): string | null => {
	const lastDotIndex = filename.lastIndexOf(".");
	return lastDotIndex > 0
		? filename.substring(lastDotIndex + 1).toLowerCase()
		: null;
};

const isSystemExecutable = (
	normalizedPath: string,
	normalizedName: string,
): boolean => {
	// Check if it's in a system directory
	for (const sysPath of SYSTEM_EXECUTABLES) {
		if (normalizedPath.includes(sysPath)) {
			return true;
		}
	}

	// Check for system executable names
	const systemNames = [
		"wmplayer.exe",
		"explorer.exe",
		"notepad.exe",
		"calc.exe",
		"cmd.exe",
		"powershell.exe",
		"msiexec.exe",
		"regsvr32.exe",
		"svchost.exe",
		"winlogon.exe",
		"csrss.exe",
		"lsass.exe",
		"spoolsv.exe",
	];

	return systemNames.includes(normalizedName);
};

const isDevelopmentTool = (
	normalizedPath: string,
	_normalizedName: string,
): boolean => {
	// Check path for development tool indicators
	for (const tool of DEVELOPMENT_TOOLS) {
		if (normalizedPath.includes(tool)) {
			return true;
		}
	}

	// Check for common development tool patterns
	const devPatterns = [
		/node_modules/,
		/\.git/,
		/\.vscode/,
		/gradle/,
		/kotlin/,
		/android.*studio/,
		/visual.*studio/,
		/microsoft.*sdk/,
		/windows.*kit/,
		/chrome.*devtools/,
		/puppeteer/,
		/updater/,
		/installer\.exe$/,
	];

	return devPatterns.some((pattern) => pattern.test(normalizedPath));
};

const isUserDirectory = (parentDir: string): boolean => {
	const userDirPatterns = [
		/desktop$/,
		/documents$/,
		/downloads$/,
		/games$/,
		/my games$/,
		/gaming$/,
	];

	return userDirPatterns.some((pattern) => pattern.test(parentDir));
};

const isGamePath = (normalizedPath: string): boolean => {
	for (const gamePath of COMMON_GAME_PATHS) {
		if (normalizedPath.includes(gamePath)) {
			return true;
		}
	}

	const gamePathPatterns = [
		/steam.*steamapps.*common/,
		/epic.*games/,
		/gog.*galaxy/,
		/origin.*games/,
		/ubisoft.*game.*launcher/,
		/program files.*games/,
		/program files \(x86\).*games/,
	];

	return gamePathPatterns.some((pattern) => pattern.test(normalizedPath));
};

const hasGameKeywords = (fileName: string): boolean => {
	// Check for exact matches
	if (GAME_INDICATORS.has(fileName)) {
		return true;
	}

	// Check for partial matches
	for (const indicator of GAME_INDICATORS) {
		if (fileName.includes(indicator)) {
			return true;
		}
	}

	return false;
};

const hasGameExecutablePattern = (fileName: string): boolean => {
	const gamePatterns = [
		/^game$/,
		/^play$/,
		/^start$/,
		/^launch/,
		/^run/,
		/game$/,
		/launcher$/,
		/client$/,
		/main$/,
		/arcade/,
		/puzzle/,
		/adventure/,
		/action/,
		/racing/,
		/sports/,
		/strategy/,
		/simulation/,
		/rpg/,
		/fps/,
		/mmo/,
	];

	return gamePatterns.some((pattern) => pattern.test(fileName));
};

const isReasonableGameLocation = (normalizedPath: string): boolean => {
	// Locations where games are commonly found
	const reasonableLocations = [
		/users.*desktop/,
		/users.*documents/,
		/users.*downloads/,
		/users.*games/,
		/program files.*(?!windows|microsoft|common files)/,
		/program files \(x86\).*(?!windows|microsoft|common files)/,
		/games/,
		/steam/,
		/epic/,
		/gog/,
		/origin/,
		/ubisoft/,
	];

	return reasonableLocations.some((pattern) => pattern.test(normalizedPath));
};
