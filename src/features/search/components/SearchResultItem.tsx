import { Gamepad2 } from "lucide-react";
import type { IGDBReturnDataType } from "@/@types";
import IGDBImage from "@/components/IGDBImage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandItem } from "@/components/ui/command";
import { P, TypographyMuted } from "@/components/ui/typography";
import { formatGameDate } from "@/lib";

interface SearchResultItemProps {
	game: IGDBReturnDataType;
	onSelect: () => void;
}

export default function SearchResultItem({
	game,
	onSelect,
}: SearchResultItemProps) {
	const dateResult = formatGameDate(game);
	const date = dateResult?.human;

	return (
		<CommandItem
			key={game.id}
			value={game.name}
			onSelect={onSelect}
			className="group cursor-pointer"
		>
			<div className="flex w-full items-center gap-3">
				{game.cover?.image_id ? (
					<IGDBImage
						alt={game.name}
						imageId={game.cover.image_id}
						className="size-10 rounded-md object-cover shadow-sm transition-transform duration-200 group-aria-selected:scale-105"
					/>
				) : (
					<Avatar className="size-10 transition-transform duration-200 group-aria-selected:scale-105">
						<AvatarFallback className="bg-muted/50">
							<Gamepad2 className="size-5" />
						</AvatarFallback>
					</Avatar>
				)}
				<div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
					<P className="truncate font-medium text-sm group-aria-selected:text-accent-foreground">
						{game.name}
					</P>
					{date && (
						<TypographyMuted className="text-xs">{date}</TypographyMuted>
					)}
				</div>
			</div>
		</CommandItem>
	);
}
