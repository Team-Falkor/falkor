import { Loader2 } from "lucide-react";
import type { FC } from "react";
import type { ScanStats } from "@/@types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { P, TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib";

interface ScanProgressProps {
	stats: ScanStats;
	isScanning: boolean;
}

const formatTimeRemaining = (ms: number) => {
	if (ms <= 0) return "Calculating...";
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
};

export const ScanProgress: FC<ScanProgressProps> = ({ stats, isScanning }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{isScanning && <Loader2 className="h-4 w-4 animate-spin" />}
					Scan Progress
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{isScanning && (
					<>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Progress</span>
								<span>{Math.round(stats.progressPercentage ?? 0)}%</span>
							</div>
							<Progress value={stats.progressPercentage} className="h-2" />
						</div>
						{!!stats.estimatedTimeRemaining && (
							<div className="text-muted-foreground text-sm">
								Estimated time remaining:{" "}
								{formatTimeRemaining(stats.estimatedTimeRemaining)}
							</div>
						)}
					</>
				)}

				<div className="grid grid-cols-4 gap-4 text-sm">
					<div className="space-y-1">
						<TypographyMuted>Directories</TypographyMuted>
						<P className="font-medium">
							{stats.processedDirs.toLocaleString()}
						</P>
					</div>
					<div className="space-y-1">
						<TypographyMuted>Files</TypographyMuted>
						<P className="font-medium">
							{stats.processedFiles.toLocaleString()}
						</P>
					</div>
					<div className="space-y-1">
						<TypographyMuted>Games Found</TypographyMuted>
						<P className="font-medium text-primary">
							{stats.gamesFound.toLocaleString()}
						</P>
					</div>
					<div className="space-y-1">
						<TypographyMuted>Errors</TypographyMuted>
						<P
							className={cn(
								"font-medium",
								stats.errors > 0 && "text-destructive",
							)}
						>
							{stats.errors.toLocaleString()}
						</P>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
