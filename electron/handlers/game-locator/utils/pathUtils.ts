import path from "node:path";

export const normalizePath = (inputPath: string): string => {
	return path.resolve(inputPath).replace(/\\/g, "/");
};

export const isValidPath = (inputPath: string): boolean => {
	try {
		path.resolve(inputPath);
		return true;
	} catch {
		return false;
	}
};

export const sanitizePath = (inputPath: string): string => {
	// Remove null bytes and other dangerous characters
	return inputPath.replace(/\0/g, "").replace(/\.\./g, "");
};
