import { useGameLocatorStore } from "@/features/game-locator/stores/gameLocator";

export const GameLocatorAddGamesStep = () => {
	const { selectedGames } = useGameLocatorStore();

	return (
		<div>
			<h1>Add Games</h1>
		</div>
	);
};
