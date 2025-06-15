/**
 * Gets the filename from a file path string.
 * This function is environment-agnostic and has no dependencies.
 *
 * @param path The full path to the file.
 * @returns The filename, including the extension.
 */
export function getFilenameFromPath(path: string): string {
	// Find the index of the last separator (`/` or `\`)
	const lastSeparatorIndex = Math.max(
		path.lastIndexOf("/"),
		path.lastIndexOf("\\"),
	);

	// If no separator is found, the path itself is the filename
	if (lastSeparatorIndex === -1) {
		return path;
	}

	// Return the part of the string after the last separator
	return path.substring(lastSeparatorIndex + 1);
}
