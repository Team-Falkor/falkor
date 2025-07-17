import { FolderPlus, Play, Square, Trash2 } from "lucide-react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { P, TypographyMuted } from "@/components/ui/typography";

interface FolderSelectionProps {
	selectedPaths: string[];
	isScanning: boolean;
	error: string | null;
	onAddFolder: () => void;
	onRemoveFolder: (path: string) => void;
	onStartScan: () => void;
	onStopScan: () => void;
}

export const FolderSelection: FC<FolderSelectionProps> = ({
	selectedPaths,
	isScanning,
	error,
	onAddFolder,
	onRemoveFolder,
	onStartScan,
	onStopScan,
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FolderPlus className="h-5 w-5" />
					Scan Folders
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-3 sm:flex-row">
					<Button
						onClick={onAddFolder}
						variant="outline"
						disabled={isScanning}
						size="sm"
						className="flex-shrink-0"
					>
						<FolderPlus className="mr-2 h-4 w-4" />
						Add Folder
					</Button>
					{selectedPaths.length > 0 && (
						<Button
							onClick={isScanning ? onStopScan : onStartScan}
							variant={isScanning ? "destructive" : "default"}
							size="sm"
							className="flex-shrink-0"
						>
							{isScanning ? (
								<>
									<Square className="mr-2 h-4 w-4" />
									Stop Scan
								</>
							) : (
								<>
									<Play className="mr-2 h-4 w-4" />
									Start Scan
								</>
							)}
						</Button>
					)}
				</div>

				{selectedPaths.length > 0 && (
					<div className="space-y-2">
						<TypographyMuted>Selected folders to scan:</TypographyMuted>
						<div className="max-h-32 space-y-2 overflow-y-auto">
							{selectedPaths.map((path) => (
								<div
									key={path}
									className="flex items-center justify-between rounded-md bg-muted p-2 text-sm"
								>
									<span className="mr-2 flex-1 truncate" title={path}>
										{path}
									</span>
									<Button
										onClick={() => onRemoveFolder(path)}
										variant="ghost"
										size="sm"
										disabled={isScanning}
										className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}

				{error && (
					<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
						<P className="text-destructive text-sm">{error}</P>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
