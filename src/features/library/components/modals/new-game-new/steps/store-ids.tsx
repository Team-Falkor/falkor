import type { GenericStepProps } from "@/features/library/@types";
import { useNewGameStore } from "@/features/library/stores/new-game";

interface Props extends GenericStepProps {}

export const StoreIDsStep = ({ filename }: Props) => {
	const { game } = useNewGameStore();

	return (
		<div>
			<h1>Store IDs</h1>
			<p>Store IDs for {game.gameName}</p>
			<pre>{JSON.stringify(game, null, 2)}</pre>
		</div>
	);
};
