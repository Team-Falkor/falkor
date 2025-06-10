import { db } from "@backend/database";
import { achievements } from "@backend/database/schemas";
import { and, eq } from "drizzle-orm";
import type {
	AchievementFile,
	AchivementStat,
	IGetSchemaForGame,
	UnlockedAchievement,
} from "@/@types/achievements/types";
import logger from "../logging";
import { NotificationsHandler } from "../notifications";
import { achievementData } from "./data";
import { AchievementFileLocator } from "./locator";
import { AchievementParser } from "./parse";
import { AchievementWatcher } from "./watcher";

interface Options {
	game_name: string;
	game_id: string;
	game_icon?: string;
	steam_id?: string | null;
	wine_prefix_folder?: string | null;
}

class AchievementItem {
	private bufferInterval = 2000;
	private initialized = false;

	public game_name: string;
	public game_id: string;
	public steam_id: string | null = null;
	public game_icon: string | null = null;
	public wine_prefix_folder: string | null = null;

	private achievement_files: AchievementFile[] = [];
	private readonly parser = new AchievementParser();
	private readonly api = achievementData;

	private achivement_data: IGetSchemaForGame | null = null;
	private file_unlocked_achievements: Set<UnlockedAchievement> = new Set();

	private watcher: AchievementWatcher | null = null;
	private notificationBuffer: AchivementStat[] = [];
	private notificationTimer: NodeJS.Timeout | null = null;

	constructor({
		game_name,
		game_id,
		game_icon,
		steam_id,
		wine_prefix_folder,
	}: Options) {
		this.game_name = game_name;
		this.game_id = game_id;
		this.steam_id = steam_id || null;
		this.game_icon = game_icon || null;
		this.wine_prefix_folder = wine_prefix_folder || null;
	}

	async init(): Promise<void> {
		if (this.initialized || !this.steam_id) return;

		try {
			console.log(`Initializing AchievementItem for game: ${this.game_name}`);
			this.achivement_data = await this.api.get(this.steam_id);
			this.initialized = true;
		} catch (error) {
			console.error(
				`Failed to initialize AchievementItem for game: ${this.game_name}`,
				error,
			);
			logger.log("error", `Failed to initialize AchievementItem: ${error}`);
		}
	}

	async find(): Promise<void> {
		if (!this.steam_id) return;
		if (!this.initialized) await this.init();

		try {
			console.log(`Finding achievement files for game: ${this.game_name}`);
			this.achievement_files = AchievementFileLocator.findAchievementFiles(
				this.steam_id,
				this.wine_prefix_folder,
			);

			if (this.achievement_files.length === 0) return;

			const watcherPath = this.achievement_files[0].path;
			this.watcher = new AchievementWatcher(watcherPath);
			this.watcher.start(async (event) => {
				if (event === "change") await this.handleAchievementChange();
			});
		} catch (error) {
			console.error(
				`Error finding achievement files for game: ${this.game_name}`,
				error,
			);
			logger.log("error", `Error finding achievement files: ${error}`);
		}
	}

	private async handleAchievementChange(): Promise<void> {
		const unlocked = await this.compare();
		if (!unlocked) return;

		const dbItems = await db
			.select({ achievementName: achievements.achievementName })
			.from(achievements)
			.where(
				and(
					eq(achievements.gameId, this.game_id),
					eq(achievements.unlocked, true),
				),
			);

		const dbAchievementNames = new Set(
			dbItems.map((item) => item.achievementName),
		);

		const newAchievements = unlocked.filter(
			(achievement) => !dbAchievementNames.has(achievement.name),
		);

		if (newAchievements.length > 0) {
			await this.saveAndNotify(newAchievements);
		}
	}

	private async saveAndNotify(
		achievementsToSave: AchivementStat[],
	): Promise<void> {
		for (const achievement of achievementsToSave) {
			console.log(`Adding new achievement: ${achievement.name}`);
			await db.insert(achievements).values({
				achievementDisplayName: achievement.displayName,
				gameId: this.game_id,
				achievementName: achievement.name,
				description: achievement.description,
				unlocked: true,
			});
		}

		this.bufferNotifications(achievementsToSave);
	}

	private bufferNotifications(achievements: AchivementStat[]): void {
		this.notificationBuffer.push(...achievements);

		if (this.notificationTimer) {
			clearTimeout(this.notificationTimer);
		}

		this.notificationTimer = setTimeout(
			() => this.flushNotifications(),
			this.bufferInterval,
		);
	}

	private async flushNotifications(): Promise<void> {
		if (this.notificationBuffer.length === 0) return;

		const summaryTitle =
			this.notificationBuffer.length === 1
				? this.notificationBuffer[0].displayName
				: `${this.notificationBuffer.length} Achievements Unlocked!`;

		const summaryBody =
			this.notificationBuffer.length === 1
				? (this.notificationBuffer[0].description ?? "New achievement unlocked")
				: this.notificationBuffer
						.map((ach) => `- ${ach.displayName}`)
						.join("\n");

		const findIcon = this.notificationBuffer.filter((ach) => !ach.icon?.length);
		const icon = findIcon[0]?.icon ?? this.game_icon ?? null;

		NotificationsHandler.constructNotification(
			{
				title: summaryTitle,
				body: summaryBody,
				icon: icon ? await NotificationsHandler.createImage(icon) : undefined,
				notificationType: "achievement_unlocked",
			},
			true,
		);

		this.notificationBuffer = [];
		this.notificationTimer = null;
	}

	async parse(): Promise<void> {
		for (const file of this.achievement_files) {
			try {
				const parsedAchievements = this.parser.parseAchievements(
					file.path,
					file.cracker,
				);
				parsedAchievements.forEach((achievement) =>
					this.file_unlocked_achievements.add(achievement),
				);
			} catch (error) {
				console.error(`Error parsing achievement file: ${file.path}`, error);
				logger.log("error", `Error parsing achievement file: ${error}`);
			}
		}
	}

	async compare(): Promise<AchivementStat[] | undefined> {
		await this.parse();

		if (!this.achivement_data?.game?.availableGameStats?.achievements) {
			console.warn(`No achievements available for game: ${this.game_name}`);
			return;
		}

		const unlockedAchievements = new Map<string, AchivementStat>();
		const achievementsList =
			this.achivement_data.game.availableGameStats.achievements;

		for (const fileAchievement of this.file_unlocked_achievements) {
			if (unlockedAchievements.has(fileAchievement.name)) continue;

			const matchedAchievement = achievementsList.find(
				(achievement) => achievement.name === fileAchievement.name,
			);

			if (matchedAchievement) {
				unlockedAchievements.set(fileAchievement.name, {
					name: fileAchievement.name,
					displayName: matchedAchievement.displayName,
					hidden: matchedAchievement.hidden,
					description: matchedAchievement.description,
					icon: matchedAchievement.icon ?? this.game_icon,
					icongray: matchedAchievement.icongray ?? this.game_icon,
					unlockTime: fileAchievement.unlockTime,
				});
			}
		}

		return Array.from(unlockedAchievements.values());
	}

	get watcher_instance() {
		return this.watcher;
	}
}

export { AchievementItem };
