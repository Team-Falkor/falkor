import { CircleAlert } from "lucide-react";
import type { JSX } from "react";
import { memo } from "react";
import type { LogEntry } from "@/@types/logs";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleWarningDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleWarningDisplay = memo(
	({ description, customIcon, timestamp }: ConsoleWarningDisplayProps) => {
		return (
			<BaseLog
				timestamp={timestamp}
				className="border-yellow-200/50 hover:border-yellow-300 hover:bg-yellow-50/30 dark:border-yellow-900/50 dark:hover:border-yellow-800 dark:hover:bg-yellow-950/30"
			>
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400">
					{customIcon ? customIcon : <CircleAlert className="h-4 w-4" />}
				</div>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<Badge
						variant="outline"
						className="border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
					>
						WARN
					</Badge>
					<TypographyMuted className="min-w-0 flex-1 break-words font-mono text-sm">
						{description}
					</TypographyMuted>
				</div>
			</BaseLog>
		);
	},
);

ConsoleWarningDisplay.displayName = "ConsoleWarningDisplay";

export { ConsoleWarningDisplay };
