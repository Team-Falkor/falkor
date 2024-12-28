export interface AchievementDBItem {
  id: number;
  game_id: string;
  game_name: string;
  achievement_name: string;
  achievement_display_name: string;
  achievement_description: string;
  achievement_image: string;
  achievement_unlocked: boolean; // Use boolean for unlocked state.
}

export interface NewAchievementInputDBItem {
  game_id: string;
  game_name: string;
  achievement_name: string;
  achievement_display_name: string;
  achievement_description?: string;
  achievement_image: string;
  achievement_unlocked?: boolean; // Defaults to false.
}
