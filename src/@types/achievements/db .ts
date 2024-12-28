export interface AchievementDBItem {
  readonly id: number;
  readonly game_id: string;
  readonly achievement_name: string;
  readonly description: string | null;
  readonly unlocked: boolean;
  readonly unlocked_at: Date | null;
}

export interface NewAchievementInputDBItem {
  game_id: string;
  achievement_name: string;
  achievement_display_name: string;
  achievement_description?: string;
  achievement_image: string;
  achievement_unlocked?: boolean;
  achievement_unlocked_at?: Date;
}
