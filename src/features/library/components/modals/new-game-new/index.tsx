import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useState,
} from "react";
import { MultiStepDialog } from "@/components/MultiStepDialog";
import { useNewGameStore } from "@/features/library/stores/new-game";
import { trpc } from "@/lib";
import { getFilenameFromPath } from "@/lib/helpers/get-filename";
import { NewGameButton } from "../../new-game";

type Props = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
};

export const NewGameDialog = ({ setOpen, open }: Props) => {
	const [start, setStart] = useState(false);
	const [filename, setFilename] = useState("");

	const { updateGame } = useNewGameStore();
	const openDialog = trpc.app.openDialog.useMutation();

	const handleFileSelect = useCallback(async () => {
		console.log("2");
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
			handleClose();
			return;
		}
		if (selected.result.canceled) {
			handleClose();
			return;
		}
		if (!selected.result.filePaths.length) {
			handleClose();
			return;
		}

		const selectedPath = selected.result.filePaths[0];
		const filename = getFilenameFromPath(selectedPath);

		if (!selectedPath || !filename) {
			handleClose();
			return;
		}

		setFilename(filename);
		updateGame({
			gameName: filename,
		});

		setStart(true);
	}, [openDialog.mutateAsync, updateGame]);

	useEffect(() => {
		if (!open) return;
		handleFileSelect();
	}, [open, handleFileSelect]);

	const handleClose = useCallback(() => {
		setOpen(false);
		setStart(false);
	}, [setOpen]);

	return (
		<>
			<NewGameButton onClick={() => setOpen(true)} />
			<MultiStepDialog
				isOpen={start}
				onClose={handleClose}
				steps={[
					{
						title: "Select Game",
						description: "Which game are you trying to add?",
						component: "Which game are you trying to add?",
					},
					{
						title: "Store Game ids",
						description:
							"Store ids are not needed, but is used for achievements",
						component: "Store ids are not needed, but is used for achievements",
					},
					{
						title: "Is this the correct game?",
						description: `Is this the correct game? ${filename}`,
						component: "Is this the correct game?",
					},
				]}
			/>
		</>
	);
};
