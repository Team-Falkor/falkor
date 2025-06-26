import { Ban } from "lucide-react";
import type { JSX } from "react";
import { memo } from "react";
import type { LogEntry } from "@/@types/logs";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleErrorDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleErrorDisplay = memo(
	({ description, customIcon, timestamp }: ConsoleErrorDisplayProps) => {
		return (
			<BaseLog
				timestamp={timestamp}
				className="border-red-200/50 hover:border-red-300 hover:bg-red-50/30 dark:border-red-900/50 dark:hover:border-red-800 dark:hover:bg-red-950/30"
			>
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
					{customIcon ? customIcon : <Ban className="h-4 w-4" />}
				</div>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<Badge
						variant="outline"
						className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
					>
						ERROR
					</Badge>
					<TypographyMuted className="min-w-0 flex-1 break-words font-mono text-sm">
						{description}
					</TypographyMuted>
				</div>
			</BaseLog>
		);
	},
);

ConsoleErrorDisplay.displayName = "ConsoleErrorDisplay";

export { ConsoleErrorDisplay };
