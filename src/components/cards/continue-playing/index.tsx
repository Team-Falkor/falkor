import type { RouterInputs, RouterOutputs } from "@/@types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import BackgroundImage from "./background-image";
import ContinuePlayingCardOverlay from "./overlay";

type LibraryGame = RouterOutputs["library"]["list"][number];

type ContinuePlayingCardProps = {
	game: LibraryGame;
	bg_image: string;
	fetchGames: () => void;
	deleteGame: (gameId: string) => void;
	updateGame: (updates: RouterInputs["library"]["update"]) => void;
};

const ContinuePlayingCard = ({
	game,
	bg_image,
	fetchGames,
	deleteGame,
	updateGame,
}: ContinuePlayingCardProps) => {
	// If you have a hook for launching games, use it here. Otherwise, remove unused logic.
	// const { isGameRunning, launchGame, stopGame } = useGameLauncher();
	// const gameRunning = isGameRunning(game.game_id);

	return (
		<Card
			className={cn(
				"relative h-[280px] w-[200px] overflow-hidden shadow-md transition-all duration-300",
				"hover:scale-[1.02] hover:shadow-primary/10 hover:shadow-xl",
			)}
		>
			<div className="relative h-full w-full">
				<BackgroundImage
					bgImage={bg_image}
					className="h-full w-full transition-transform duration-300 group-hover:scale-105"
				/>
				<div className="absolute inset-0 z-10 h-full w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
				<div className="absolute inset-0 z-20 h-full w-full">
					<ContinuePlayingCardOverlay
						// playGame={playGame}
						// stopGame={stopGame}
						deleteGame={deleteGame}
						updateGame={updateGame}
						fetchGames={fetchGames}
						game={game}
					/>
				</div>
			</div>
		</Card>
	);
};

export default ContinuePlayingCard;
