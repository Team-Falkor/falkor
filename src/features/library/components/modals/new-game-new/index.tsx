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
import { createSlug, trpc } from "@/lib";
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
	const [filenameNoExt, setFilenameNoExt] = useState("");

	const { game, setInitialData } = useNewGameStore();
	const openDialog = trpc.app.openDialog.useMutation();

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

		if (!selected.success || !selected.result) {
			console.log("No file selected");
			handleClose();
			return;
		}
		if (selected.result.canceled) {
			console.log("User canceled");
			handleClose();
			return;
		}
		if (!selected.result.filePaths.length) {
			console.log("No file selected");
			handleClose();
			return;
		}

		const selectedPath = selected.result.filePaths[0];
		const filename = getFilenameFromPath(selectedPath);
		const filenameNoExt = filename?.split(".")[0];

		console.log({
			selectedPath,
			filename,
			filenameNoExt,
		});

		if (!selectedPath || !filename) {
			handleClose();
			return;
		}
		setFilenameNoExt(filenameNoExt);
		setInitialData({
			gameName: filenameNoExt,
			gamePath: selectedPath,
			installed: true,
		});

		setStart(true);
	}, [openDialog.mutateAsync, setInitialData]);

	useEffect(() => {
		if (!open) return;
		if (start) return;
		handleFileSelect();
	}, [open, handleFileSelect, start]);

	const handleClose = useCallback(() => {
		setOpen(false);
		setStart(false);
	}, [setOpen]);

	return (
		<>
			<NewGameButton onClick={() => setOpen(true)} />
			<MultiStepDialog
				isOpen={start}
				resetOnCancel={true}
				onClose={handleClose}
				confirmLabel="Add Game"
				dialogContentClassName="w-full sm:max-w-2xl flex flex-col h-[85vh]"
				onConfirm={() => {
					const gameName = game.gameName;
					const gamePath = game.gamePath;
					if (!gameName || !gamePath) return;

					try {
						createGame({
							gameId: createSlug(gameName),
							gameName: gameName,
							gamePath: gamePath,
							gameArgs: game.gameArgs,
							gameIcon: game.gameIcon,
							gameCommand: game.gameCommand,
							igdbId: game.igdbId ? Number.parseInt(game.igdbId) : undefined,
							gameSteamId: game.steamId,
							installed: !!gamePath,
							winePrefixFolder: game.winePrefixFolder,
						});
						toast.success("Game added");
					} catch (error) {
						console.log(error);
						toast.error("Error adding game");
					}
					handleClose();
				}}
				steps={[
					{
						title: "Select Game",
						description: "Which game are you trying to add?",
						component: <DisplayResultsStop filename={filenameNoExt} />,
					},
					{
						title: "Confirm & Finalize",
						description:
							"Review and adjust the game details before adding to your library",
						component: <ConfirmationStep />,
					},
				]}
			/>
		</>
	);
};
