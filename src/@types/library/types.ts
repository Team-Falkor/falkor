/**
 * Represents a game entry in the `library_games` table.
 */
export interface LibraryGame {
  id: number;
  game_name: string;
  game_path: string;
  game_id: string;
  game_steam_id?: string | null;
  game_icon?: string;
  game_args?: string;
  game_command?: string;
  game_playtime: number;
  game_last_played?: Date | null;
  igdb_id?: number | null;
}

/**
 * Type for adding a new game.
 */
export type NewLibraryGame = Omit<
  LibraryGame,
  "id" | "game_playtime" | "game_last_played"
>;

/**
 * Type for updating game fields.
 */
export type LibraryGameUpdate = Partial<Omit<LibraryGame, "game_id" | "id">>;
