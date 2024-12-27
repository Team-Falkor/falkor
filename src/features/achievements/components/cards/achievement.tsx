import { ISchemaForGameAchievement } from "@/@types";

export const AchievementCard = ({
  displayName,

  icongray,
  icon,
  description,
}: ISchemaForGameAchievement) => {
  const unlocked = Math.random() < 0.5;

  return (
    <div className="relative flex flex-col w-40 gap-2">
      <img
        src={unlocked ? icon : icongray}
        alt={displayName}
        className="object-cover w-full h-40"
      />

      <div className="flex flex-col gap-0.5">
        <h2 className="flex text-sm font-medium truncate">{displayName}</h2>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
