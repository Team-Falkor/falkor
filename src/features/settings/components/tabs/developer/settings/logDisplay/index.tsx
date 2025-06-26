import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Confirmation from "@/components/confirmation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";
import LogWindow from "./logWindow";

const LogDisplay = () => {
	const utils = trpc.useUtils();

	const { mutate: removeLogs } = trpc.logging.clearLogs.useMutation({
		onError: (err) => {
			toast.error("error clearing logs", {
				description: err.message,
			});
			console.error("Error clearing logs:", err);
		},
		onSuccess: () => {
			toast.success("Logs cleared");
			utils.logging.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});
	const { t } = useLanguageContext();

	const getInitialEnabledState = useCallback(() => {
		const storedValue = localStorage.getItem("enableDevConsole");
		return storedValue ? JSON.parse(storedValue) : false;
	}, []);

	const [enabled, setEnabled] = useState<boolean>(getInitialEnabledState);

	useEffect(() => {
		setEnabled(getInitialEnabledState());
	}, [getInitialEnabledState]);

	const onCheckedChange = (value: boolean) => {
		localStorage.setItem("enableDevConsole", JSON.stringify(value));
		setEnabled(value);
	};

	return (
		<div className="flex flex-col" id="developer-settings">
			<div className="flex justify-between">
				<div className="flex items-center gap-2" id="show-dev-console">
					<Switch
						id="show-dev-console"
						onCheckedChange={onCheckedChange}
						checked={enabled}
					/>
					<Label htmlFor="show-dev-console">
						{t("settings.settings.show_dev_console")}
					</Label>
				</div>

				<Confirmation onConfirm={() => removeLogs()}>
					<Button>Clear Logs</Button>
				</Confirmation>
			</div>

			<LogWindow enabled={enabled} />
		</div>
	);
};

export default LogDisplay;
