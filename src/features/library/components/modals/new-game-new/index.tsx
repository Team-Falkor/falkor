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
import { DisplayResultsStop } from "./steps/display-results";
import { StoreIDsStep } from "./steps/store-ids";

type Props = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
};

export const NewGameDialog = ({ setOpen, open }: Props) => {
	const [start, setStart] = useState(false);
	const [filenameNoExt, setFilenameNoExt] = useState("");

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
		const filenameNoExt = filename?.split(".")[0];

		if (!selectedPath || !filename) {
			handleClose();
			return;
		}
		setFilenameNoExt(filenameNoExt);
		updateGame({
			gameName: filenameNoExt,
			gamePath: selectedPath,
			installed: true,
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
				resetOnCancel={true}
				onClose={handleClose}
				confirmLabel="Add Game"
				steps={[
					{
						title: "Select Game",
						description: "Which game are you trying to add?",
						component: <DisplayResultsStop filename={filenameNoExt} />,
					},
					{
						title: "Store Game ids",
						description:
							"Store ids are not needed, but is used for achievements",
						component: <StoreIDsStep filename={filenameNoExt} />,
					},
					{
						title: "Is this the correct game?",
						description: `Is this the correct game? ${filenameNoExt}`,
						component: "Is this the correct game?",
					},
				]}
			/>
		</>
	);
};
