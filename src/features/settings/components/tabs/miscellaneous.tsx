import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";
import { SettingsSection } from "../section";
import { SettingsItem } from "../settingsItem";
import SettingTitle from "../title";
import SettingsContainer from "./container";

const MiscellaneousSettings = () => {
	const { t } = useLanguageContext();
	const [loadingStates, setLoadingStates] = useState({
		all: false,
		data: false,
		images: false,
	});

	const handleResetCache = async () => {
		console.log("Resetting IGDB cache");
		localStorage.removeItem("igdb_access_token");
		localStorage.removeItem("igdb_token_expiration");

		window.location.reload();
	};

	const { mutate: cleanupCache } = trpc.app.cleanupCache.useMutation({
		onSuccess: (data) => {
			if (data.success) {
				toast.success(t("settings.settings.cache-cleared-successfully"), {
					description: data.message,
				});
			} else {
				toast.error(t("settings.settings.cache-clear-failed"), {
					description: data.message,
				});
			}
		},
		onError: (error) => {
			toast.error(t("settings.settings.cache-clear-failed"), {
				description: error.message,
			});
		},
		onSettled: () => {
			setLoadingStates({ all: false, data: false, images: false });
		},
	});

	const handleCacheCleanup = (type: "all" | "data" | "images") => {
		setLoadingStates((prev) => ({ ...prev, [type]: true }));
		cleanupCache({ type });
	};

	return (
		<div>
			<SettingTitle>{t("settings.titles.Miscellaneous")}</SettingTitle>

			<SettingsContainer>
				<SettingsSection title="reset-igdb-cache">
					<SettingsItem title="reset-igdb-cache">
						<Button onClick={handleResetCache}>
							{t("settings.settings.reset-igdb-cache")}
						</Button>
					</SettingsItem>
				</SettingsSection>

				<SettingsSection
					title="cache-management"
					description={t("cache-management-description")}
				>
					<div className="flex w-full flex-row gap-2">
						<Button
							variant="destructive"
							onClick={() => handleCacheCleanup("all")}
							disabled={loadingStates.all}
						>
							{loadingStates.all
								? "Clearing..."
								: t("settings.settings.clear-all-cache")}
						</Button>

						<Button
							variant="outline"
							onClick={() => handleCacheCleanup("data")}
							disabled={loadingStates.data}
						>
							{loadingStates.data
								? "Clearing..."
								: t("settings.settings.clear-data-cache")}
						</Button>

						<Button
							variant="outline"
							onClick={() => handleCacheCleanup("images")}
							disabled={loadingStates.images}
						>
							{loadingStates.images
								? "Clearing..."
								: t("settings.settings.clear-image-cache")}
						</Button>
					</div>
				</SettingsSection>
			</SettingsContainer>
		</div>
	);
};

export default MiscellaneousSettings;
