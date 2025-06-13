import type { RouterOutputs } from "@/@types";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib";

type Props = RouterOutputs["achievements"]["getUnlockedWithGameData"][number];

export const AchievementCard = ({
	displayName,
	icongray,
	icon,
	description,
	unlocked,
}: Props) => {
	return (
		<div className="relative flex w-40 flex-col gap-2">
			<img
				src={unlocked ? icon : icongray}
				alt={displayName}
				className="h-40 w-full overflow-hidden rounded-lg object-cover"
			/>

			<div className="flex flex-col gap-0.5">
				<TypographySmall
					className={cn("flex truncate font-medium", {
						"text-muted-foreground": !unlocked,
					})}
				>
					{displayName}
				</TypographySmall>
				{description && (
					<TypographyMuted className="line-clamp-2 text-xs">
						{description}
					</TypographyMuted>
				)}
			</div>
		</div>
	);
};
