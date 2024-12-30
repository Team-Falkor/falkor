import { ISchemaForGameAchievement } from "@/@types";
import { cn } from "@/lib";

interface Props extends ISchemaForGameAchievement {
  unlocked: boolean;
}

export const AchievementCard = ({
  displayName,

  icongray,
  icon,
  description,
  unlocked,
}: Props) => {
  return (
    <div className="relative flex flex-col w-40 gap-2">
      <img
        src={unlocked ? icon : icongray}
        alt={displayName}
        className="object-cover w-full h-40 overflow-hidden rounded-lg"
      />

      <div className="flex flex-col gap-0.5">
        <h2
          className={cn("flex text-sm font-medium truncate", {
            "text-muted-foreground": !unlocked,
          })}
        >
          {displayName}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
