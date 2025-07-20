import type { ProtonVersionInfo } from "@team-falkor/game-launcher";
import { useState } from "react";
import { toast } from "sonner";
import type { RouterInputs } from "@/@types";
import { useLanguageContext } from "@/i18n/I18N";
import { cn, trpc } from "@/lib";
import { ProtonControls } from "./proton-controls";
import { ProtonHeader } from "./proton-header";
import { ProtonInstallationProgress } from "./proton-installation-progress";
import { ProtonVersionsTable } from "./proton-versions-table";

type ProtonVariant = RouterInputs["proton"]["getVersionsForVariant"]["variant"];

interface ProtonVersionManagerProps {
	className?: string;
}

export const ProtonVersionManager = ({
	className,
}: ProtonVersionManagerProps) => {
	const { t } = useLanguageContext();
	const [selectedVariant, setSelectedVariant] =
		useState<ProtonVariant>("proton-ge");
	const [installingVersion, setInstallingVersion] = useState<string | null>(
		null,
	);
	const [installProgress, setInstallProgress] = useState<number>(0);
	const [installStatus, setInstallStatus] = useState<string>("");

	// tRPC queries
	const {
		data: availableVersions,
		isLoading,
		refetch: refetchVersions,
	} = trpc.proton.getVersionsForVariant.useQuery({
		variant: selectedVariant,
	});

	// tRPC mutations
	const installMutation = trpc.proton.installVersion.useMutation({
		onSuccess: () => {
			toast.success(t("proton.installation_completed_successfully"));
			setInstallingVersion(null);
			setInstallProgress(0);
			setInstallStatus("");
			refetchVersions();
		},
		onError: (error) => {
			toast.error(`${t("proton.installation_failed")}: ${error.message}`);
			setInstallingVersion(null);
			setInstallProgress(0);
			setInstallStatus("");
		},
	});

	const removeMutation = trpc.proton.removeVersion.useMutation({
		onSuccess: () => {
			toast.success(t("proton.version_removed_successfully"));
			refetchVersions();
		},
		onError: (error) => {
			toast.error(`${t("proton.failed_to_remove_version")}: ${error.message}`);
		},
	});

	const refreshMutation = trpc.proton.refreshVersions.useMutation({
		onSuccess: () => {
			toast.success(t("proton.versions_refreshed"));
			refetchVersions();
		},
		onError: (error) => {
			toast.error(`${t("proton.failed_to_refresh")}: ${error.message}`);
		},
	});

	// Subscribe to installation progress
	trpc.proton.subscribeToInstallProgress.useSubscription(undefined, {
		onData: (data) => {
			switch (data.type) {
				case "status":
					if (
						!("status" in data.data) ||
						typeof data.data.status !== "string"
					) {
						break;
					}
					setInstallStatus(data.data.status);
					break;
				case "downloadProgress":
					if (
						!("percent" in data.data) ||
						typeof data.data.percent !== "number"
					) {
						break;
					}
					setInstallProgress(Math.round(data.data.percent));
					setInstallStatus(
						`${t("proton.downloading")} ${data.data.percent.toFixed(1)}%`,
					);
					break;
				case "extractionProgress":
					if (
						!("percent" in data.data) ||
						typeof data.data.percent !== "number"
					) {
						break;
					}
					setInstallProgress(Math.round(data.data.percent));
					setInstallStatus(
						`${t("proton.extracting")} ${data.data.percent.toFixed(1)}%`,
					);
					break;
				case "complete":
					setInstallProgress(100);
					setInstallStatus(t("proton.installation_complete"));
					break;
				case "error":
					if (!("error" in data.data) || typeof data.data.error !== "string") {
						break;
					}
					toast.error(`${t("proton.installation_error")}: ${data.data.error}`);
					setInstallingVersion(null);
					setInstallProgress(0);
					setInstallStatus("");
					break;
			}
		},
		enabled: !!installingVersion,
	});

	const handleInstall = async (version: string) => {
		setInstallingVersion(version);
		setInstallProgress(0);
		setInstallStatus(t("proton.preparing_installation"));

		installMutation.mutate({
			version,
			variant: selectedVariant,
		});
	};

	const handleUninstall = async (version: string) => {
		removeMutation.mutate({
			version,
			variant: selectedVariant,
		});
	};

	const handleRefresh = async () => {
		refreshMutation.mutate();
	};

	const handleVariantChange = (variant: ProtonVariant) => {
		setSelectedVariant(variant);
	};

	return (
		<div className={cn("flex h-full flex-col gap-6 p-6", className)}>
			<ProtonHeader />

			<ProtonControls
				selectedVariant={selectedVariant}
				onVariantChange={handleVariantChange}
				onRefresh={handleRefresh}
				isLoading={isLoading}
				isRefreshing={refreshMutation.isPending}
			/>

			{installingVersion && (
				<ProtonInstallationProgress
					installingVersion={installingVersion}
					installProgress={installProgress}
					installStatus={installStatus}
				/>
			)}

			<ProtonVersionsTable
				availableVersions={availableVersions as ProtonVersionInfo[] | undefined}
				installingVersion={installingVersion}
				onInstall={handleInstall}
				onUninstall={handleUninstall}
				installMutationPending={installMutation.isPending}
				removeMutationPending={removeMutation.isPending}
			/>
		</div>
	);
};
