import { Zap } from "lucide-react";
import type { JSX } from "react";
import { memo } from "react";
import type { LogEntry } from "@/@types/logs";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted } from "@/components/ui/typography";
import { BaseLog } from "./base";

interface ConsoleTraceDisplayProps {
	customIcon?: JSX.Element;
	// title: string;
	description: string;
	timestamp?: LogEntry["timestamp"];
}

const ConsoleTraceDisplay = memo(
	({ description, customIcon, timestamp }: ConsoleTraceDisplayProps) => {
		return (
			<BaseLog
				timestamp={timestamp}
				className="border-gray-200/50 hover:border-gray-300 hover:bg-gray-50/30 dark:border-gray-700/50 dark:hover:border-gray-600 dark:hover:bg-gray-800/30"
			>
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
					{customIcon ? customIcon : <Zap className="h-4 w-4" />}
				</div>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<Badge
						variant="outline"
						className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
					>
						TRACE
					</Badge>
					<TypographyMuted className="min-w-0 flex-1 break-words font-mono text-sm">
						{description}
					</TypographyMuted>
				</div>
			</BaseLog>
		);
	},
);

ConsoleTraceDisplay.displayName = "ConsoleTraceDisplay";

export { ConsoleTraceDisplay };
