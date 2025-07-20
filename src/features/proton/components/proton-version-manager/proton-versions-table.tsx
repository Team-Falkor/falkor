import type { ProtonVersionInfo } from "@team-falkor/game-launcher";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { formatBytes } from "@/lib";
import { ProtonStatusBadge } from "./proton-status-badge";

interface ProtonVersionsTableProps {
	availableVersions: ProtonVersionInfo[] | undefined;
	installingVersion: string | null;
	onInstall: (version: string) => void;
	onUninstall: (version: string) => void;
	installMutationPending: boolean;
	removeMutationPending: boolean;
}

export const ProtonVersionsTable = ({
	availableVersions,
	installingVersion,
	onInstall,
	onUninstall,
	installMutationPending,
	removeMutationPending,
}: ProtonVersionsTableProps) => {
	const { t } = useLanguageContext();

	return (
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
						{!!availableVersions?.length &&
							availableVersions.map((version) => {
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
										<TableCell>
											<ProtonStatusBadge
												version={version}
												installingVersion={installingVersion}
											/>
										</TableCell>
										<TableCell>
											<TypographyMuted className="text-sm">
												{version.releaseDate
													? new Date(version.releaseDate).toLocaleDateString()
													: "N/A"}
											</TypographyMuted>
										</TableCell>
										<TableCell>
											<TypographyMuted className="text-sm">
												{version.size ? formatBytes(version.size) : "N/A"}
											</TypographyMuted>
										</TableCell>
										<TableCell className="max-w-0">
											<TypographyMuted className="truncate text-sm">
												{version.description}
											</TypographyMuted>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												{version.installed ? (
													<Button
														variant="destructive"
														size="icon"
														onClick={() => onUninstall(version.version)}
														disabled={
															installingVersion !== null ||
															removeMutationPending
														}
													>
														{removeMutationPending ? (
															<Loader2 className="animate-spin" />
														) : (
															<Trash2 />
														)}
													</Button>
												) : (
													<Button
														variant="default"
														size="icon"
														onClick={() => onInstall(version.version)}
														disabled={
															installingVersion !== null ||
															installMutationPending
														}
													>
														{installMutationPending &&
														installingVersion === version.version ? (
															<Loader2 className="animate-spin" />
														) : (
															<Download />
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
	);
};
