import { ISchemaForGameAchievement } from "@/@types";
import { TypographyMuted } from "@/components/typography/muted";
import { TypographySmall } from "@/components/typography/small";
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
        <TypographySmall
          className={cn("flex font-medium truncate", {
            "text-muted-foreground": !unlocked,
          })}
        >
          {displayName}
        </TypographySmall>
        {description && (
          <TypographyMuted className="text-xs line-clamp-2">
            {description}
          </TypographyMuted>
        )}
      </div>
    </div>
  );
};
