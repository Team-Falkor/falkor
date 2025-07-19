import { CheckCircle, Download, Loader2, Trash2 } from "lucide-react";
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
import { cn } from "@/lib";

interface ProtonVersion {
	version: string;
	variant: "proton-ge";
	releaseDate: string;
	size: string;
	isInstalled: boolean;
	isLatest: boolean;
	description?: string;
}

interface InstallProgress {
	type:
		| "status"
		| "downloadProgress"
		| "extractionProgress"
		| "complete"
		| "error";
	data: {
		progress?: number;
		status?: string;
		error?: string;
		variant?: string;
		version?: string;
	};
}

interface ProtonVersionManagerProps {
	className?: string;
}

const mockVersions: ProtonVersion[] = [
	{
		version: "GE-Proton9-16",
		variant: "proton-ge",
		releaseDate: "2024-11-15",
		size: "1.2 GB",
		isInstalled: true,
		isLatest: true,
		description: "Latest stable release with improved compatibility",
	},
	{
		version: "GE-Proton9-15",
		variant: "proton-ge",
		releaseDate: "2024-11-01",
		size: "1.1 GB",
		isInstalled: true,
		isLatest: false,
		description: "Previous stable release",
	},
	{
		version: "GE-Proton9-14",
		variant: "proton-ge",
		releaseDate: "2024-10-20",
		size: "1.1 GB",
		isInstalled: false,
		isLatest: false,
		description: "Older stable release",
	},
	{
		version: "GE-Proton9-13",
		variant: "proton-ge",
		releaseDate: "2024-10-05",
		size: "1.0 GB",
		isInstalled: false,
		isLatest: false,
		description: "Legacy release",
	},
];

export const ProtonVersionManager = ({
	className,
}: ProtonVersionManagerProps) => {
	const { t } = useLanguageContext();
	const [selectedVariant, setSelectedVariant] =
		useState<"proton-ge">("proton-ge");
	const [versions, setVersions] = useState<ProtonVersion[]>(mockVersions);
	const [installingVersion, setInstallingVersion] = useState<string | null>(
		null,
	);
	const [installProgress, setInstallProgress] = useState<number>(0);
	const [installStatus, setInstallStatus] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	const simulateInstallation = async (version: string) => {
		setInstallingVersion(version);
		setInstallProgress(0);
		setInstallStatus("Downloading...");

		for (let i = 0; i <= 100; i += 10) {
			await new Promise((resolve) => setTimeout(resolve, 200));
			setInstallProgress(i);
			if (i === 50) setInstallStatus("Extracting...");
			if (i === 90) setInstallStatus("Installing...");
		}

		setVersions((prev) =>
			prev.map((v) =>
				v.version === version ? { ...v, isInstalled: true } : v,
			),
		);

		setInstallingVersion(null);
		setInstallProgress(0);
		setInstallStatus("");
		toast.success(`${version} installed successfully`);
	};

	const handleInstall = async (version: string) => {
		try {
			await simulateInstallation(version);
		} catch (error) {
			toast.error(`Failed to install ${version}`);
			setInstallingVersion(null);
			setInstallProgress(0);
			setInstallStatus("");
		}
	};

	const handleUninstall = async (version: string) => {
		try {
			setVersions((prev) =>
				prev.map((v) =>
					v.version === version ? { ...v, isInstalled: false } : v,
				),
			);
			toast.success(`${version} uninstalled successfully`);
		} catch (error) {
			toast.error(`Failed to uninstall ${version}`);
		}
	};

	const handleRefresh = async () => {
		setIsLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success("Version list refreshed");
		} catch (error) {
			toast.error("Failed to refresh versions");
		} finally {
			setIsLoading(false);
		}
	};

	const getStatusBadge = (version: ProtonVersion) => {
		if (installingVersion === version.version) {
			return (
				<Badge variant="secondary" className="gap-1">
					<Loader2 className="size-3 animate-spin" />
					Installing
				</Badge>
			);
		}
		if (version.isInstalled) {
			return (
				<Badge variant="default" className="gap-1">
					<CheckCircle className="size-3" />
					Installed
				</Badge>
			);
		}
		return null;
	};

	return (
		<div className={cn("flex h-full flex-col gap-6 p-6", className)}>
			{/* Header */}
			<div className="flex-shrink-0">
				<H2 className="mb-2">Proton Version Manager</H2>
				<TypographyMuted>
					Manage and install Proton compatibility layers for running Windows
					games on Linux.
				</TypographyMuted>
			</div>

			{/* Controls */}
			<div className="flex flex-shrink-0 items-center gap-4">
				<div className="flex items-center gap-2">
					<TypographyMuted>Variant:</TypographyMuted>
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
					size="sm"
					onClick={handleRefresh}
					disabled={isLoading}
				>
					{isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
					Refresh
				</Button>
			</div>

			{/* Installation Progress */}
			{installingVersion && (
				<div className="flex-shrink-0 rounded-lg border bg-muted/50 p-4">
					<div className="mb-2 flex items-center justify-between">
						<H5>Installing {installingVersion}</H5>
						<TypographyMuted>{installProgress}%</TypographyMuted>
					</div>
					<Progress value={installProgress} className="mb-2" />
					<TypographyMuted className="text-sm">{installStatus}</TypographyMuted>
				</div>
			)}

			{/* Versions Table */}
			<div className="min-h-0 flex-1 rounded-md border">
				<ScrollArea className="h-full">
					<Table>
						<TableHeader className="sticky top-0 z-10 bg-background">
							<TableRow>
								<TableHead className="w-[20%] min-w-[180px]">Version</TableHead>
								<TableHead className="w-[15%] min-w-[120px]">Status</TableHead>
								<TableHead className="w-[15%] min-w-[120px]">
									Release Date
								</TableHead>
								<TableHead className="w-[10%] min-w-[80px]">Size</TableHead>
								<TableHead>Description</TableHead>
								<TableHead className="w-[10%] min-w-[100px] text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{versions.map((version) => (
								<TableRow key={version.version}>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											<span className="truncate">{version.version}</span>
											{version.isLatest && (
												<Badge
													variant="secondary"
													className="flex-shrink-0 text-xs"
												>
													Latest
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
											{version.size}
										</TypographyMuted>
									</TableCell>
									<TableCell className="truncate">
										<TypographyMuted className="text-sm">
											{version.description}
										</TypographyMuted>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											{version.isInstalled ? (
												<Button
													variant="destructive"
													size="icon"
													onClick={() => handleUninstall(version.version)}
													disabled={installingVersion !== null}
												>
													<Trash2 className="size-4" />
												</Button>
											) : (
												<Button
													variant="default"
													size="icon"
													onClick={() => handleInstall(version.version)}
													disabled={installingVersion !== null}
												>
													<Download className="size-4" />
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</ScrollArea>
			</div>
		</div>
	);
};
