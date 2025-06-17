import type GameProcessLauncher from "./game-process-launcher";
/** Active game sessions keyed by game ID. */
export const gamesLaunched: Map<number, GameProcessLauncher> = new Map();
