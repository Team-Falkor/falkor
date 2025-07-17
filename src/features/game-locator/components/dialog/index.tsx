import { useState } from "react";
import { MultiStepDialog } from "@/components/MultiStepDialog";
import { Button } from "@/components/ui/button";
import { GameLocatorScanFoldersStep } from "./steps/scan-folders";

export const GameLocatorDialog = () => {
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
					},
				]}
			/>
		</>
	);
};
