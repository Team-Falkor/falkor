import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
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

const EXECUTABLE_EXTENSIONS = [
	"exe",
	"bat",
	"cmd",
	"sh",
	"run",
	"AppImage",
	"jar",
	"url",
] as const;

export const NewGameDialog = ({ setOpen, open }: Props) => {
	const [start, setStart] = useState(false);
	const [filenameNoExt, setFilenameNoExt] = useState("");

	// Use ref to track if component is mounted
	const isMountedRef = useRef(true);
	const abortControllerRef = useRef<AbortController | null>(null);

	const { createGame } = useGames();
	const { game, setInitialData, reset } = useNewGameStore();
	const openDialog = trpc.app.openDialog.useMutation();

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			abortControllerRef.current?.abort();
		};
	}, []);

	const handleFileSelect = useCallback(async () => {
		abortControllerRef.current = new AbortController();

		try {
			const selected = await openDialog.mutateAsync({
				properties: ["openFile"],
				filters: [
					{
						name: "Executable",
						extensions: [...EXECUTABLE_EXTENSIONS],
					},
				],
			});

			// Check if component is still mounted
			if (!isMountedRef.current) return;

			if (
				!selected.success ||
				!selected.result ||
				selected.result.canceled ||
				!selected.result.filePaths.length
			) {
				console.log("No file selected or user canceled");
				handleClose();
				return;
			}

			const selectedPath = selected.result.filePaths[0];
			const filename = getFilenameFromPath(selectedPath);

			if (!selectedPath || !filename) {
				console.log("Invalid file path or filename");
				handleClose();
				return;
			}

			const filenameWithoutExt =
				filename.split(".").slice(0, -1).join(".") || filename;

			console.log({
				selectedPath,
				filename,
				filenameNoExt: filenameWithoutExt,
			});

			// Only update state if component is still mounted
			if (isMountedRef.current) {
				setFilenameNoExt(filenameWithoutExt);
				setInitialData({
					gameName: filenameWithoutExt,
					gamePath: selectedPath,
					installed: true,
				});
				setStart(true);
			}
		} catch (error) {
			if (!isMountedRef.current) return;

			console.error("Error selecting file:", error);
			toast.error("Failed to select file");
			handleClose();
		}
	}, [openDialog.mutateAsync, setInitialData]);

	// Trigger file selection when dialog opens
	useEffect(() => {
		if (!open || start) return;

		let isCancelled = false;

		const initializeFileSelection = async () => {
			// Small delay to ensure dialog state is properly set
			await new Promise((resolve) => setTimeout(resolve, 100));

			if (!isCancelled && isMountedRef.current) {
				await handleFileSelect();
			}
		};

		initializeFileSelection();

		return () => {
			isCancelled = true;
		};
	}, [open, start, handleFileSelect]);

	const handleClose = useCallback(() => {
		abortControllerRef.current?.abort();
		setOpen(false);
		setStart(false);
		reset(); // Reset store state
	}, [setOpen, reset]);

	const handleConfirm = useCallback(async () => {
		const {
			gameName,
			gamePath,
			gameArgs,
			gameIcon,
			gameCommand,
			igdbId,
			steamId,
			winePrefixFolder,
		} = game;

		if (!gameName || !gamePath) {
			toast.error("Game name and path are required");
			return;
		}

		try {
			await createGame({
				gameId: createSlug(gameName),
				gameName,
				gamePath,
				gameArgs,
				gameIcon,
				gameCommand,
				igdbId: igdbId ? Number.parseInt(igdbId) : undefined,
				gameSteamId: steamId,
				installed: !!gamePath,
				winePrefixFolder,
			});

			toast.success("Game added successfully");
			handleClose();
		} catch (error) {
			console.error("Error adding game:", error);
			toast.error("Failed to add game");
		}
	}, [game, createGame, handleClose]);

	return (
		<>
			<NewGameButton onClick={() => setOpen(true)} />
			<MultiStepDialog
				isOpen={start}
				resetOnCancel={true}
				onClose={handleClose}
				confirmLabel="Add Game"
				dialogContentClassName="w-full sm:max-w-5xl flex flex-col h-[85vh]"
				onConfirm={handleConfirm}
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
