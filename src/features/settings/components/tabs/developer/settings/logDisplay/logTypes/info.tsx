import { Info } from "lucide-react";
import type { JSX } from "react";
import { memo } from "react";
import type { LogEntry } from "@/@types/logs";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleInfoDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleInfoDisplay = memo(
	({ description, customIcon, timestamp }: ConsoleInfoDisplayProps) => {
		return (
			<BaseLog
				timestamp={timestamp}
				className="border-blue-200/50 hover:border-blue-300 hover:bg-blue-50/30 dark:border-blue-900/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
			>
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
					{customIcon ? customIcon : <Info className="h-4 w-4" />}
				</div>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<Badge
						variant="outline"
						className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
					>
						INFO
					</Badge>
					<TypographyMuted className="min-w-0 flex-1 break-words font-mono text-sm">
						{description}
					</TypographyMuted>
				</div>
			</BaseLog>
		);
	},
);

ConsoleInfoDisplay.displayName = "ConsoleInfoDisplay";

export { ConsoleInfoDisplay };
