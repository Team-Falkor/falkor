import { format } from "date-fns";
import type { HTMLAttributes, PropsWithChildren } from "react";
import { memo } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib";

interface Props extends HTMLAttributes<HTMLDivElement> {
	timestamp?: number;
}

const BaseLog = memo(
	({ children, timestamp, className }: PropsWithChildren<Props>) => {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							"group flex w-full cursor-pointer items-center justify-start gap-3 rounded-lg border border-transparent px-4 py-3 text-left transition-all hover:border-muted hover:bg-muted/30 hover:shadow-sm",
							className,
						)}
					>
						{children}
					</div>
				</TooltipTrigger>

				{!!timestamp && (
					<TooltipContent side="left" className="font-mono text-xs">
						<div className="flex flex-col gap-1">
							<div className="font-medium">Timestamp</div>
							<div className="text-muted-foreground">
								{format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
							</div>
						</div>
					</TooltipContent>
				)}
			</Tooltip>
		);
	},
);

BaseLog.displayName = "BaseLog";

export { BaseLog };
