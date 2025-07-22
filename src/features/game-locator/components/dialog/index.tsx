import { useState } from "react";
import { toast } from "sonner";
import { MultiStepDialog } from "@/components/MultiStepDialog";
import { Button } from "@/components/ui/button";
import { useGameLocatorStore } from "../../stores/gameLocator";
import { GameLocatorAddGamesStep } from "./steps/add-games";
import { GameLocatorScanFoldersStep } from "./steps/scan-folders";
import { GameLocatorSelectGamesStep } from "./steps/select-games";

export const GameLocatorDialog = () => {
	const {
		hasCompletedAddGames,
		hasCompletedScanFolders,
		hasCompletedSelectGames,
	} = useGameLocatorStore();
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setOpen(true)}>Open</Button>
			<MultiStepDialog
				isOpen={open}
				onClose={() => setOpen(false)}
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
					},
					{
						title: "Select games",
						component: <GameLocatorSelectGamesStep />,
						beforeNext: async () => {
							if (!hasCompletedSelectGames) return false;
							return true;
						},
					},
					{
						title: "Add games",
						component: <GameLocatorAddGamesStep />,
						beforeNext: async () => {
							if (!hasCompletedAddGames) return false;
							return true;
						},
					},
				]}
			/>
		</>
	);
};
