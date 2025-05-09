import type {
	BaseSettingsValue,
	NestedSettingsObject,
	SettingsConfig,
} from "@/@types/settings";
import { constants } from "../../utils/constants";
import { JsonFileEditor } from "../json/jsonFileEditor";
import { defaultSettings } from "./constants";

export class SettingsManager {
	private static instance: SettingsManager;
	private editor!: JsonFileEditor<SettingsConfig>;
	private hasInitialized = false;

	/** Private constructor — singleton */
	private constructor() {}

	/** Get singleton instance */
	public static getInstance(): SettingsManager {
		if (!SettingsManager.instance) {
			SettingsManager.instance = new SettingsManager();
		}
		return SettingsManager.instance;
	}

	/** Lazy init */
	private init(): void {
		if (this.hasInitialized) return;

		this.editor = new JsonFileEditor<SettingsConfig>({
			filePath: constants.settingsPath,
			createDirs: true,
			verbose: true,
			formatting: { tabSize: 2, insertSpaces: true },
			defaultContent: defaultSettings,
			validate: (data): data is SettingsConfig =>
				typeof data === "object" && data !== null,
		});

		this.hasInitialized = true;
	}

	/** Get a value using dotted path */
	public get<
		T extends BaseSettingsValue | NestedSettingsObject = BaseSettingsValue,
	>(key: keyof SettingsConfig): T | undefined {
		this.init();
		return this.editor.get<T>(key?.toString());
	}

	/** Get all settings */
	public getAll(): SettingsConfig {
		this.init();
		// read always returns a valid SettingsConfig (fallback to defaultSettings)
		return this.editor.read() ?? defaultSettings;
	}

	/** Set or overwrite a value at any key */
	public set(
		key: string,
		value: BaseSettingsValue | NestedSettingsObject,
	): boolean {
		this.init();
		return this.editor.updateKey(key, value);
	}

	/** Only create key if it doesn't already exist */
	public create(
		key: string,
		value: BaseSettingsValue | NestedSettingsObject,
	): boolean {
		this.init();
		const current = this.get(key);
		if (current !== undefined) {
			console.warn(`Key '${key}' already exists, skipping create.`);
			return false;
		}
		return this.set(key, value);
	}

	/** Merge partial object into existing object at key */
	public update<
		K extends Extract<keyof SettingsConfig, string>,
		V extends SettingsConfig[K],
	>(key: K, value: V extends object ? Partial<V> : V): boolean {
		this.init();
		const existing = this.get<SettingsConfig[K]>(key);

		// Handle primitive types directly
		if (typeof existing !== "object" || existing === null) {
			return this.set(key, value);
		}

		// Handle object types with merge
		const merged = Object.assign({}, existing, value);
		return this.set(key, merged);
	}

	/** Delete a key */
	public clear(key: string): boolean {
		this.init();
		return this.editor.deleteKey(key);
	}

	/** Reset to default settings */
	public reset(): boolean {
		this.init();
		return this.editor.reset();
	}

	/** Overwrite entire settings file */
	public overwriteAll(data: SettingsConfig): boolean {
		this.init();
		return this.editor.write(data);
	}
}
