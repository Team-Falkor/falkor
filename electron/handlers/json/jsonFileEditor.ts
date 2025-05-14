import * as fs from "node:fs";
import * as path from "node:path";
import {
	applyEdits,
	type FormattingOptions,
	findNodeAtLocation,
	modify,
	type ParseError,
	parse,
	parseTree,
} from "jsonc-parser";

export interface JsonFileEditorOptions<T extends object> {
	filePath: string;
	defaultContent?: T;
	validate?: (data: unknown) => data is T;
	createDirs?: boolean;
	verbose?: boolean;
	formatting?: FormattingOptions;
}

export interface JsonOperationResult<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export class JsonFileEditor<T extends object> {
	private filePath: string;
	private defaultContent?: T;
	private validate?: (data: unknown) => data is T;
	private verbose: boolean;
	private formatting: FormattingOptions;

	constructor(options: JsonFileEditorOptions<T>) {
		this.filePath = options.filePath;
		this.defaultContent = options.defaultContent;
		this.validate = options.validate;
		this.verbose = options.verbose ?? false;
		this.formatting = options.formatting ?? { tabSize: 2, insertSpaces: true };

		if (options.createDirs) {
			const dir = path.dirname(this.filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
				this.log(`Created directory ${dir}`);
			}
		}

		if (!fs.existsSync(this.filePath) && this.defaultContent) {
			const init = JSON.stringify(
				this.defaultContent,
				null,
				this.formatting.insertSpaces ? this.formatting.tabSize : 1,
			);
			fs.writeFileSync(this.filePath, init, "utf8");
			this.log(`Initialized ${this.filePath} with default content`);
		}
	}

	public read(): T | null {
		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			const errors: ParseError[] = [];
			const data = parse(raw, errors, { allowTrailingComma: true });
			if (errors.length) {
				this.logError(
					`Parse errors in ${this.filePath}: ${errors.map((e) => `offset ${e.offset}`).join(", ")}`,
				);
				return null;
			}
			if (this.validate && !this.validate(data)) {
				this.logError(`Validation failed for data in ${this.filePath}`);
				return null;
			}
			return data as T;
		} catch (err) {
			this.logError(`Failed to read ${this.filePath}`, err);
			return null;
		}
	}

	public get<U>(key: string, defaultValue?: U): U | undefined {
		const raw = fs.readFileSync(this.filePath, "utf8");
		const root = parseTree(raw, [], { allowTrailingComma: true });
		if (!root) return defaultValue;
		const node = findNodeAtLocation(root, key.split("."));
		return node ? (node.value as U) : defaultValue;
	}

	public updateKey<T = unknown>(key: string, value: T): boolean {
		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			const pathSegments = key.split(".");
			const edits = modify(raw, pathSegments, value, {
				formattingOptions: this.formatting,
			});
			const updated = applyEdits(raw, edits);
			this.writeRaw(updated);
			return true;
		} catch (err) {
			this.logError(`Failed to update key \"${key}\"`, err);
			return false;
		}
	}

	public deleteKey(pathStr: string): boolean {
		return this.updateKey(pathStr, undefined);
	}

	/** Overwrite entire file (drops comments) */
	public write(data: T): boolean {
		if (this.validate && !this.validate(data)) {
			this.logError("Validation failed — not writing file");
			return false;
		}
		try {
			this.createBackup();
			const pretty = JSON.stringify(
				data,
				null,
				this.formatting.insertSpaces ? this.formatting.tabSize : 1,
			);
			this.writeRaw(pretty);
			return true;
		} catch (err) {
			this.logError(`Error writing ${this.filePath}`, err);
			return false;
		}
	}

	/** Reset to default content if provided */
	public reset(): boolean {
		if (this.defaultContent === undefined) {
			this.logError("No defaultContent to reset to");
			return false;
		}
		return this.write(this.defaultContent);
	}

	private writeRaw(text: string) {
		fs.writeFileSync(this.filePath, text, "utf8");
		this.log(`Wrote ${this.filePath}`);
	}

	private createBackup() {
		if (fs.existsSync(this.filePath)) {
			const backup = `${this.filePath}.backup`;
			fs.copyFileSync(this.filePath, backup);
			this.log(`Backup created at ${backup}`);
		}
	}

	private log(msg: string) {
		if (this.verbose) console.log("[JsonFileEditor]", msg);
	}

	private logError(msg: string, err?: unknown) {
		const details = err instanceof Error ? err.message : String(err || "");
		console.error(
			"[JsonFileEditor ERROR]",
			`${msg}${details ? `: ${details}` : ""}`,
		);
	}
}
