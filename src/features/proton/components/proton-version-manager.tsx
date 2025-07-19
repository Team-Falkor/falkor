import type { ProtonVersionInfo } from "@team-falkor/game-launcher";
import {
	CheckCircle,
	Download,
	Loader2,
	RefreshCcw,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { H2, H5, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { cn, formatBytes, trpc } from "@/lib";

interface ProtonVersionManagerProps {
	className?: string;
}
export const ProtonVersionManager = ({
	className,
}: ProtonVersionManagerProps) => {
	const { t } = useLanguageContext();
	const [selectedVariant, setSelectedVariant] =
		useState<"proton-ge">("proton-ge");
	const [installingVersion, setInstallingVersion] = useState<string | null>(
		null,
	);
	const [installProgress, setInstallProgress] = useState<number>(0);
	const [installStatus, setInstallStatus] = useState<string>("");

	// tRPC queries
	const {
		data: availableVersions = [],
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

	const getStatusBadge = (version: ProtonVersionInfo) => {
		if (installingVersion === version.version) {
			return (
				<Badge variant="secondary" className="gap-1">
					<Loader2 className="size-3 animate-spin" />
					{t("proton.installing")}
				</Badge>
			);
		}
		if (version.installed) {
			return (
				<Badge variant="default" className="gap-1">
					<CheckCircle className="size-3" />
					{t("proton.installed")}
				</Badge>
			);
		}

		return (
			<Badge variant="destructive" className="gap-1">
				<XCircle />
				{t("proton.not_installed")}
			</Badge>
		);
	};

	return (
		<div className={cn("flex h-full flex-col gap-6 p-6", className)}>
			{/* Header */}
			<div className="flex-shrink-0">
				<H2 className="mb-2">{t("proton.title")}</H2>
				<TypographyMuted>{t("proton.description")}</TypographyMuted>
			</div>

			{/* Controls */}
			<div className="flex flex-shrink-0 items-center gap-4">
				<div className="flex items-center gap-2">
					<TypographyMuted>{t("proton.variant")}</TypographyMuted>
					<Select
						value={selectedVariant}
						onValueChange={(value: "proton-ge") => setSelectedVariant(value)}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="proton-ge">Proton-GE</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					variant="outline"
					// size="sm"
					onClick={handleRefresh}
					disabled={isLoading || refreshMutation.isPending}
				>
					{isLoading || refreshMutation.isPending ? (
						<Loader2 className="animate-spin" />
					) : (
						<RefreshCcw />
					)}
				</Button>
			</div>

			{/* Installation Progress */}
			{installingVersion && (
				<div className="flex-shrink-0 rounded-lg border bg-muted/50 p-4">
					<div className="mb-2 flex items-center justify-between">
						<H5>
							{t("proton.installing")} {installingVersion}
						</H5>
						<TypographyMuted>{installProgress}%</TypographyMuted>
					</div>
					<Progress value={installProgress} className="mb-2" />
					<TypographyMuted className="text-sm">{installStatus}</TypographyMuted>
				</div>
			)}

			{/* Versions Table */}
			<div className="min-h-0 flex-1 overflow-hidden rounded-md border">
				<ScrollArea className="h-full">
					<Table>
						<TableHeader className="sticky top-0 z-10 bg-background">
							<TableRow>
								<TableHead className="w-[20%] min-w-[180px]">
									{t("proton.version")}
								</TableHead>
								<TableHead className="w-[15%] min-w-[120px]">
									{t("proton.status")}
								</TableHead>
								<TableHead className="w-[15%] min-w-[120px]">
									{t("proton.release_date")}
								</TableHead>
								<TableHead className="w-[10%] min-w-[80px]">
									{t("proton.size")}
								</TableHead>
								<TableHead>{t("proton.description_column")}</TableHead>
								<TableHead className="w-[10%] min-w-[100px] text-right">
									{t("proton.actions")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{availableVersions.map((version) => {
								return (
									<TableRow key={version.version}>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												<span className="truncate">{version.version}</span>
												{version.isLatestVersion && (
													<Badge
														variant="secondary"
														className="flex-shrink-0 text-xs"
													>
														{t("proton.latest")}
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>{getStatusBadge(version)}</TableCell>
										<TableCell>
											<TypographyMuted className="text-sm">
												{new Date(version.releaseDate).toLocaleDateString()}
											</TypographyMuted>
										</TableCell>
										<TableCell>
											<TypographyMuted className="text-sm">
												{formatBytes(version.size)}
											</TypographyMuted>
										</TableCell>
										<TableCell className="max-w-0">
											<TypographyMuted className="line-clamp-2 break-words text-sm">
												{version.description}
											</TypographyMuted>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												{version.installed ? (
													<Button
														variant="destructive"
														size="icon"
														onClick={() => handleUninstall(version.version)}
														disabled={
															installingVersion !== null ||
															removeMutation.isPending
														}
													>
														{removeMutation.isPending ? (
															<Loader2 className="animate-spin" />
														) : (
															<Trash2 />
														)}
													</Button>
												) : (
													<Button
														variant="default"
														size="icon"
														onClick={() => handleInstall(version.version)}
														disabled={
															installingVersion !== null ||
															installMutation.isPending
														}
													>
														{installMutation.isPending &&
														installingVersion === version.version ? (
															<Loader2 className="size-4 animate-spin" />
														) : (
															<Download className="size-4" />
														)}
													</Button>
												)}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</ScrollArea>
			</div>
		</div>
	);
};
