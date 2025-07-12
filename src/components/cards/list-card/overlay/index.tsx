import { Pencil } from "lucide-react";
import type { RouterOutputs } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/i18n/I18N";
import DeleteDialog from "./delete";
import UpdateDialog from "./edit";
import { FavoriteGame } from "./favorite-game";
import { HideGame } from "./hide-game";

type LibraryGame = RouterOutputs["library"]["list"][number];

interface ContinuePlayingCardOverlayProps {
	game: LibraryGame;
}

export const EditGameOverlay = ({ game }: ContinuePlayingCardOverlayProps) => {
	const { t } = useLanguageContext();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={"default"}
					size="icon"
					className="relative z-20 rounded-full"
				>
					<Pencil />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-24" align="end">
				<DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<UpdateDialog game={game} />
				<DeleteDialog gameId={game.gameId} />
				<FavoriteGame game={game} />
				<HideGame game={game} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
