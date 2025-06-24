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
		await this.parse();

		const gameSchemaAchievements =
			this.achivement_data?.game?.availableGameStats?.achievements;

		if (!gameSchemaAchievements) {
			console.warn(
				`No achievement schema data available for game: ${this.game_name}`,
			);
			return;
		}

		const existingDbAchievements = await db
			.select({
				achievementName: achievements.achievementName,
				unlocked: achievements.unlocked,
			})
			.from(achievements)
			.where(eq(achievements.gameId, this.game_id));

		const dbAchievementMap = new Map(
			existingDbAchievements.map((item) => [
				item.achievementName,
				item.unlocked,
			]),
		);

		const achievementsToNotify: AchivementStat[] = [];

		for (const schemaAch of gameSchemaAchievements) {
			const isCurrentlyUnlockedInFile = Array.from(
				this.file_unlocked_achievements,
			).some((fileAch) => fileAch.name === schemaAch.name);
			const wasUnlockedInDb = dbAchievementMap.get(schemaAch.name);

			const currentAchStat: AchivementStat = {
				name: schemaAch.name,
				displayName: schemaAch.displayName,
				hidden: schemaAch.hidden,
				description: schemaAch.description,
				icon: schemaAch.icon ?? this.game_icon,
				icongray: schemaAch.icongray ?? this.game_icon,
				unlockTime: isCurrentlyUnlockedInFile
					? Array.from(this.file_unlocked_achievements).find(
							(a) => a.name === schemaAch.name,
						)?.unlockTime || Date.now()
					: undefined,
				unlocked: isCurrentlyUnlockedInFile,
			};

			if (wasUnlockedInDb === undefined) {
				await db
					.insert(achievements)
					.values({
						achievementDisplayName: currentAchStat.displayName,
						gameId: this.game_id,
						achievementName: currentAchStat.name,
						description: currentAchStat.description,
						unlocked: currentAchStat.unlocked,
					})
					.onConflictDoNothing({
						target: [achievements.gameId, achievements.achievementName],
					});

				if (currentAchStat.unlocked) {
					achievementsToNotify.push(currentAchStat);
				}
			} else if (isCurrentlyUnlockedInFile && !wasUnlockedInDb) {
				await db
					.update(achievements)
					.set({ unlocked: true })
					.where(
						and(
							eq(achievements.gameId, this.game_id),
							eq(achievements.achievementName, currentAchStat.name),
						),
					);
				achievementsToNotify.push(currentAchStat);
			} else if (!isCurrentlyUnlockedInFile && wasUnlockedInDb) {
				await db
					.update(achievements)
					.set({ unlocked: false })
					.where(
						and(
							eq(achievements.gameId, this.game_id),
							eq(achievements.achievementName, currentAchStat.name),
						),
					);
			}
		}

		if (achievementsToNotify.length > 0) {
			this.bufferNotifications(achievementsToNotify);
		}
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

	async parse(): Promise<UnlockedAchievement[] | undefined> {
		this.file_unlocked_achievements.clear();

		if (this.achievement_files.length === 0) {
			console.warn(`No achievement files found for game: ${this.game_name}`);
			return;
		}

		const allParsedAchievements: UnlockedAchievement[] = [];
		for (const file of this.achievement_files) {
			try {
				const parsedAchievements = this.parser.parseAchievements(
					file.path,
					file.cracker,
				);
				parsedAchievements.forEach((achievement) =>
					this.file_unlocked_achievements.add(achievement),
				);
				allParsedAchievements.push(...parsedAchievements);
			} catch (error) {
				console.error(`Error parsing achievement file: ${file.path}`, error);
				logger.log("error", `Error parsing achievement file: ${error}`);
			}
		}
		return allParsedAchievements;
	}

	async compare(): Promise<AchivementStat[] | undefined> {
		await this.parse();

		if (!this.achivement_data?.game?.availableGameStats?.achievements) {
			console.warn(`No achievements available for game: ${this.game_name}`);
			return;
		}

		const achievementsList =
			this.achivement_data.game.availableGameStats.achievements;

		const result: AchivementStat[] = [];

		for (const apiAchievement of achievementsList) {
			const fileAchievement = Array.from(this.file_unlocked_achievements).find(
				(achievement) => achievement.name === apiAchievement.name,
			);

			const isUnlocked = !!fileAchievement;
			const unlockTime = fileAchievement?.unlockTime;

			result.push({
				name: apiAchievement.name,
				displayName: apiAchievement.displayName,
				hidden: apiAchievement.hidden,
				description: apiAchievement.description,
				icon: apiAchievement.icon ?? this.game_icon,
				icongray: apiAchievement.icongray ?? this.game_icon,
				unlockTime: unlockTime,
				unlocked: isUnlocked,
			});
		}

		return result;
	}

	get watcher_instance() {
		return this.watcher;
	}
}

export { AchievementItem };
