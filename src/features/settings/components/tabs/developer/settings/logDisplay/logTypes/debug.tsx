import { Bug } from "lucide-react";
import type { JSX } from "react";
import { memo } from "react";
import type { LogEntry } from "@/@types/logs";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleDebugDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleDebugDisplay = memo(
	({ description, customIcon, timestamp }: ConsoleDebugDisplayProps) => {
		return (
			<BaseLog
				timestamp={timestamp}
				className="border-purple-200/50 hover:border-purple-300 hover:bg-purple-50/30 dark:border-purple-900/50 dark:hover:border-purple-800 dark:hover:bg-purple-950/30"
			>
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
					{customIcon ? customIcon : <Bug className="h-4 w-4" />}
				</div>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<Badge
						variant="outline"
						className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300"
					>
						DEBUG
					</Badge>
					<TypographyMuted className="min-w-0 flex-1 break-words font-mono text-sm">
						{description}
					</TypographyMuted>
				</div>
			</BaseLog>
		);
	},
);

ConsoleDebugDisplay.displayName = "ConsoleDebugDisplay";

export { ConsoleDebugDisplay };
