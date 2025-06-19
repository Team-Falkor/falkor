import { useCallback } from "react";
import type { Game } from "@/features/library/stores/new-game";
import { useNewGameStore } from "@/features/library/stores/new-game";
import { trpc } from "@/lib";
import { GameForm } from "../../../game-form";

const LOG_PREFIX = "[ConfirmationStep]";

export const ConfirmationStep = () => {
	const { game, updateGame } = useNewGameStore();
	const openDialog = trpc.app.openDialog.useMutation();

	console.log(`${LOG_PREFIX} Render. Current game state:`, game);

	const handleGameChange = useCallback(
		(updatedFields: Partial<Game>) => {
			console.log(`${LOG_PREFIX} Game state update:`, updatedFields);
			updateGame(updatedFields);
		},
		[updateGame],
	);

	const handleFileBrowse = useCallback(
		async (
			config: {
				properties: ("openFile" | "openDirectory")[];
				filters: { name: string; extensions: string[] }[];
			},
			updateKey: keyof Game,
		) => {
			console.log(`${LOG_PREFIX} Opening file dialog for:`, updateKey);
			try {
				const selected = await openDialog.mutateAsync(config);
				if (selected.canceled) {
					console.log(`${LOG_PREFIX} File selection canceled for:`, updateKey);
					return;
				}
				if (!selected.success || selected.filePaths.length === 0) {
					console.log(
						`${LOG_PREFIX} File selection failed or no file selected for:`,
						updateKey,
						selected.message || "",
					);
					return;
				}

				const path = selected.filePaths[0];
				console.log(`${LOG_PREFIX} File selected for ${updateKey}:`, path);
				updateGame({ [updateKey]: path } as Partial<Game>);
			} catch (error) {
				console.error(
					`${LOG_PREFIX} Error opening file dialog for ${updateKey}:`,
					error,
				);
			}
		},
		[openDialog, updateGame],
	);

	return (
		<GameForm
			game={game}
			onGameChange={handleGameChange}
			onFileBrowse={handleFileBrowse}
		/>
	);
};
