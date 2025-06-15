import { Button } from "@/components/ui/button";

const UpdaterDevToolPanel = () => {
	const handleTriggerUpdateCheck = () => {
		window.ipcRenderer.send("dev:trigger-real-update-check");
	};

	const handleSimulateError = () => {
		window.ipcRenderer.send("dev:simulate-error");
	};

	return (
		<div className="flex flex-col gap-2 p-4">
			<h3 className="text-center font-bold">Updater Dev Tools</h3>
			<Button size="sm" onClick={handleTriggerUpdateCheck}>
				Trigger Real Update Check
			</Button>
			<Button size="sm" variant="destructive" onClick={handleSimulateError}>
				Simulate Error
			</Button>
		</div>
	);
};

export default UpdaterDevToolPanel;
