import { useNewGameStore } from "@/features/library/stores/new-game";

export const StoreIDsStep = () => {
	const { game } = useNewGameStore();

	return (
		<div className="flex h-full w-full flex-1 flex-col gap-4 py-4">
			<h1>Store IDs</h1>
			<p>Store IDs for {game.gameName}</p>
			<pre>{JSON.stringify(game, null, 2)}</pre>
		</div>
	);
};
