import { Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SettingsConfig } from "@/@types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";
import { SettingsSection } from "../section";
import SettingTitle from "../title";
import SettingsContainer from "./container";

const TorrentSettings = () => {
	const { t } = useLanguageContext();
	const { data: settings } = trpc.settings.read.useQuery();
	const { mutate: updateSetting } = trpc.settings.update.useMutation();
	const openDialogMutation = trpc.app.openDialog.useMutation();

	const [downloadPath, setDownloadPath] = useState(
		settings?.downloadsPath ?? "",
	);
	const [maxDownloadSpeed, setMaxDownloadSpeed] = useState(
		settings?.maxDownloadSpeed ?? 0,
	);
	const [maxUploadSpeed, setMaxUploadSpeed] = useState(
		settings?.maxUploadSpeed ?? 0,
	);

	const debouncedUpdateSetting = useDebounce(
		(key: keyof SettingsConfig, value: number, cb?: () => void) => {
			updateSetting({
				path: key?.toString(),
				value,
			});
			toast.success(`Successfully updated ${key} to ${value}`);
			cb?.();
		},
		1000,
	);

	useEffect(() => {
		if (settings?.downloadsPath) {
			setDownloadPath(settings.downloadsPath);
		}
	}, [settings]);

	const handleSpeedChange = (
		key: keyof Pick<SettingsConfig, "maxDownloadSpeed" | "maxUploadSpeed">,
		value: string,
	) => {
		const parsedValue = Number.parseInt(value, 10);
		if (!Number.isNaN(parsedValue)) {
			key === "maxDownloadSpeed"
				? setMaxDownloadSpeed(parsedValue)
				: setMaxUploadSpeed(parsedValue);
			debouncedUpdateSetting(key, parsedValue, () => {
				// if (key === "maxDownloadSpeed") {
				//   invoke("torrent:throttle-download", parsedValue);
				// }
				// if (key === "maxUploadSpeed") {
				//   invoke("torrent:throttle-upload", parsedValue);
				// }
			});
		}
	};

	const openDialog = async () => {
		const selected = await openDialogMutation.mutateAsync({
			properties: ["openDirectory"],
		});

		// Consistent return shape: check for success and canceled
		if (!selected.success) {
			if (selected.message) toast.error(selected.message);
			return;
		}

		if (!selected.canceled && selected.filePaths.length > 0) {
			setDownloadPath(selected.filePaths[0]);
		}
	};

	const handleSave = () => {
		if (!downloadPath.trim()) return;
		updateSetting({
			path: "downloadsPath",
			value: downloadPath,
		});
	};

	return (
		<div>
			<SettingTitle>{t("settings.titles.Download")}</SettingTitle>

			<SettingsContainer>
				<SettingsSection title="downloads_path">
					<div className="flex flex-col gap-4">
						<div className="flex justify-between">
							<Input
								placeholder={t("settings.settings.downloads_path")}
								type="text"
								value={downloadPath}
								onChange={(e) => setDownloadPath(e.target.value)}
								aria-label="Downloads Path"
								className="rounded-lg rounded-r-none"
							/>

							<Button
								size="icon"
								className="rounded-lg rounded-l-none bg-muted focus-states:bg-muted"
								onClick={openDialog}
								aria-label="Select Folder"
								disabled={openDialogMutation.isPending}
							>
								<Folder />
							</Button>
						</div>

						<Button
							variant="success"
							onClick={handleSave}
							disabled={!downloadPath.trim()}
						>
							Save
						</Button>
					</div>
				</SettingsSection>

				<SettingsSection title="max_speed" description="max_speed_description">
					<div className="flex flex-col gap-2">
						<Label htmlFor="maxDownloadSpeed">{t("max_download_speed")}</Label>

						<Input
							id="maxDownloadSpeed"
							placeholder={t("max_download_speed")}
							type="number"
							min={-1}
							value={maxDownloadSpeed}
							onChange={(e) =>
								handleSpeedChange("maxDownloadSpeed", e.target.value)
							}
							aria-label="Max Download Speed"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="maxUploadSpeed">{t("max_upload_speed")}</Label>

						<Input
							id="maxUploadSpeed"
							placeholder={t("max_upload_speed")}
							type="number"
							min={-1}
							value={maxUploadSpeed}
							onChange={(e) =>
								handleSpeedChange("maxUploadSpeed", e.target.value)
							}
							aria-label="Max Upload Speed"
						/>
					</div>
				</SettingsSection>
			</SettingsContainer>
		</div>
	);
};

export default TorrentSettings;
