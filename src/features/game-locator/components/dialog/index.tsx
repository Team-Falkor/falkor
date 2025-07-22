import { useState } from "react";
import { toast } from "sonner";
import { MultiStepDialog } from "@/components/MultiStepDialog";
import { Button } from "@/components/ui/button";
import { useGameLocatorStore } from "../../stores/gameLocator";
import { useManualGameSelectionStore } from "../../stores/manualGameSelection";
import { GameLocatorAddGamesStep } from "./steps/add-games";
import { GameLocatorManualSelectionStep } from "./steps/manual-selection";
import { GameLocatorScanFoldersStep } from "./steps/scan-folders";
import { GameLocatorSelectGamesStep } from "./steps/select-games";

export const GameLocatorDialog = () => {
	const {
		hasCompletedAddGames,
		hasCompletedScanFolders,
		hasCompletedSelectGames,
		reset,
	} = useGameLocatorStore();
	const {
		hasCompletedManualSelection,
		requiresManualSelection,
		reset: resetManualSelection,
	} = useManualGameSelectionStore();
	const [open, setOpen] = useState(false);

	const handleClose = () => {
		setOpen(false);
		// Reset all states when dialog is closed
		reset();
		resetManualSelection();
	};

	return (
		<>
			<Button onClick={() => setOpen(true)}>Open</Button>
			<MultiStepDialog
				isOpen={open}
				onClose={handleClose}
				dialogContentClassName="w-full sm:max-w-3xl flex flex-col h-[85vh]"
				steps={[
					{
						title: "Scan folders",
						component: <GameLocatorScanFoldersStep />,
						beforeNext: async () => {
							if (!hasCompletedScanFolders) {
								toast.error("Scan folders first");
								return false;
							}
							return true;
						},
						disableNextButton: !hasCompletedScanFolders,
					},
					{
						title: "Select games",
						component: <GameLocatorSelectGamesStep />,
						beforeNext: async () => {
							if (!hasCompletedSelectGames) return false;
							return true;
						},
						disableNextButton: !hasCompletedSelectGames,
					},
					{
						title: "Add games",
						component: <GameLocatorAddGamesStep />,
						beforeNext: async () => {
							if (!hasCompletedAddGames) return false;
							return true;
						},
						disableNextButton: !hasCompletedAddGames,
						hideNextButton: !requiresManualSelection,
						cancelButtonText: !requiresManualSelection ? "Confirm" : "Cancel",
					},
					{
						title: "Manual selection",
						component: <GameLocatorManualSelectionStep />,
						beforeNext: async () => {
							if (!hasCompletedManualSelection && requiresManualSelection) {
								toast.error("Complete manual selection first");
								return false;
							}
							return true;
						},
						disableNextButton: !hasCompletedManualSelection,
					},
				]}
			/>
		</>
	);
};
