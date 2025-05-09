import { Ellipsis } from "lucide-react";
import type { RouterInputs, RouterOutputs } from "@/@types";
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

type LibraryGame = RouterOutputs["library"]["list"][number];

interface ContinuePlayingCardOverlayProps {
	game: LibraryGame;
	fetchGames: () => void;
	deleteGame: (gameId: string) => void;
	updateGame: (updates: RouterInputs["library"]["update"]) => void;
}

const ContinuePlayingCardOverlay = ({
	game,
	fetchGames,
	deleteGame,
	updateGame,
}: ContinuePlayingCardOverlayProps) => {
	const { t } = useLanguageContext();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button
					variant={"ghost"}
					size={"icon"}
					className="relative z-50 h-full w-7"
				>
					<Ellipsis size={16} />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-24" align="end">
				<DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<UpdateDialog game={game} />
				<DeleteDialog gameId={game.gameId} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ContinuePlayingCardOverlay;
