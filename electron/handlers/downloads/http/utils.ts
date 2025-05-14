import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { URL } from "node:url";

export function extractFilename(
	url: string,
	contentDisposition?: string,
): string {
	if (contentDisposition) {
		const filenameMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
		if (filenameMatch?.[1]) {
			return filenameMatch[1];
		}
	}

	try {
		const parsedUrl = new URL(url);
		const pathname = parsedUrl.pathname;
		const filename = path.basename(pathname);

		if (filename && filename !== "/" && filename.length > 0) {
			return filename.split("?")[0];
		}
	} catch (error) {
		console.error("Error parsing URL:", error);
	}

	return `download-${crypto.randomBytes(4).toString("hex")}`;
}

export async function getUniqueFilename(
	directory: string,
	filename: string,
): Promise<string> {
	const filePath = path.join(directory, filename);

	try {
		await fs.promises.access(filePath, fs.constants.F_OK);

		const ext = path.extname(filename);
		const baseName = path.basename(filename, ext);
		let counter = 1;
		let newFilename: string;

		do {
			newFilename = `${baseName} (${counter})${ext}`;
			counter++;
			try {
				await fs.promises.access(
					path.join(directory, newFilename),
					fs.constants.F_OK,
				);
			} catch {
				return newFilename;
			}
		} while (counter < 1000);

		return `${baseName}-${Date.now()}${ext}`;
	} catch {
		return filename;
	}
}

export async function calculateFileHash(filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash("sha256");
		const stream = fs.createReadStream(filePath);

		stream.on("error", (err) => reject(err));
		stream.on("data", (chunk) => hash.update(chunk));
		stream.on("end", () => resolve(hash.digest("hex")));
	});
}

export function parseContentRange(contentRange?: string): number | undefined {
	if (!contentRange) return undefined;

	const match = /\/(\d+)$/.exec(contentRange);
	if (match?.[1]) {
		return Number.parseInt(match[1], 10);
	}

	return undefined;
}

export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}
