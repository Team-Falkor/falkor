import { GameLauncher as NativeGameLauncher } from "@team-falkor/game-launcher";

export class GameLauncher extends NativeGameLauncher {
	private static instance: GameLauncher;

	private constructor() {
		super({
			logging: {
				enabled: false,
			},
			maxConcurrentGames: 2,
		});
	}

	public static getInstance(): GameLauncher {
		if (!GameLauncher.instance) {
			GameLauncher.instance = new GameLauncher();
		}
		return GameLauncher.instance;
	}
}

export const gameLauncher = GameLauncher.getInstance();
