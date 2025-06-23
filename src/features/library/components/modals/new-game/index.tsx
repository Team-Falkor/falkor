import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";
import { MultiStepDialog } from "@/components/MultiStepDialog";
import { useGames } from "@/features/library/hooks/use-games";
import { useNewGameStore } from "@/features/library/stores/new-game";
import { trpc } from "@/lib";
import { getFilenameFromPath } from "@/lib/helpers/get-filename";
import { NewGameButton } from "../../new-game";
import { ConfirmationStep } from "./steps/confirmation";
import { DisplayResultsStop } from "./steps/display-results";

type Props = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
};

export const NewGameDialog = ({ setOpen, open }: Props) => {
	const [start, setStart] = useState(false);
	const { createGame } = useGames();

	const { game, setInitialData, reset: resetNewGameStore } = useNewGameStore();
	const openDialog = trpc.app.openDialog.useMutation();

	const handleClose = useCallback(() => {
		setOpen(false);
		setStart(false);
		resetNewGameStore();
	}, [setOpen, resetNewGameStore]);

	const handleFileSelect = useCallback(async () => {
		const selected = await openDialog.mutateAsync({
			properties: ["openFile"],
			filters: [
				{
					name: "Executable",
					extensions: [
						"exe",
						"bat",
						"cmd",
						"sh",
						"run",
						"AppImage",
						"jar",
						"url",
					],
				},
			],
		});

		if (selected.canceled) {
			console.log("User canceled file selection.");
			handleClose();
			return;
		}

		if (!selected.success || selected.filePaths.length === 0) {
			console.log(
				"File selection failed or no file selected.",
				selected.message || "",
			);
			toast.error("File selection failed or no file was chosen."); // User feedback
			handleClose();
			return;
		}

		const selectedPath = selected.filePaths[0];
		const filename = getFilenameFromPath(selectedPath);
		const filenameNoExt = filename ? filename.split(".")[0] : "";

		if (!selectedPath || !filenameNoExt) {
			console.log("Invalid path or filename extracted.");
			toast.error("Invalid game path selected."); // User feedback
			handleClose();
			return;
		}

		// Ensure gamePath and gameName are set in the store
		setInitialData({
			gameName: filenameNoExt,
			gamePath: selectedPath,
			installed: true,
			// Also initialize runAsAdmin to false here if you want it off by default
			runAsAdmin: false,
		});

		setStart(true); // Proceed to the next step
	}, [openDialog.mutateAsync, setInitialData, handleClose]);

	useEffect(() => {
		if (!open) {
			resetNewGameStore(); // Ensure store is reset when dialog is initially closed (e.g., after adding a game)
			return;
		}
		if (!start) {
			// Only trigger file select if the dialog just opened and we haven't started the flow
			handleFileSelect();
		}
	}, [open, handleFileSelect, start, resetNewGameStore]);

	return (
		<>
			<NewGameButton onClick={() => setOpen(true)} />
			<MultiStepDialog
				isOpen={start} // Dialog opens when 'start' is true
				resetOnCancel={true} // Keeps this behavior
				onClose={handleClose}
				confirmLabel="Add Game"
				dialogContentClassName="w-full sm:max-w-3xl flex flex-col h-[85vh]"
				onConfirm={() => {
					const gameName = game.gameName;
					const gamePath = game.gamePath;
					if (!gameName || !gamePath) {
						toast.error("Game name or path is missing. Please check details.");
						return;
					}

					try {
						createGame({
							gameName: gameName,
							gamePath: gamePath,
							gameArgs: game.gameArgs ?? undefined,
							gameIcon: game.gameIcon ?? undefined,
							gameCommand: game.gameCommand ?? undefined,
							igdbId: game.igdbId ? game.igdbId : undefined,
							gameSteamId: game.gameSteamId ?? undefined,
							installed: !!gamePath,
							winePrefixFolder: game.winePrefixFolder ?? undefined,
							runAsAdmin: game.runAsAdmin,
						});
						toast.success("Game added successfully!");
					} catch (error) {
						console.error("Error adding game:", error);
						toast.error("Error adding game. Please try again.");
					}
					handleClose();
				}}
				steps={[
					{
						title: "Select Game",
						description: "Which game are you trying to add?",
						component: <DisplayResultsStop filename={game.gameName || ""} />,
					},
					{
						title: "Confirm & Finalize",
						description:
							"Review and adjust the game details before adding to your library",
						component: <ConfirmationStep />, // No gamePath prop needed here
					},
				]}
			/>
		</>
	);
};
