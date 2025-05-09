import { format } from "date-fns";
import type { HTMLAttributes, PropsWithChildren } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib";

interface Props extends HTMLAttributes<HTMLDivElement> {
	timestamp?: number;
}

const BaseLog = ({
	children,
	timestamp,
	className,
}: PropsWithChildren<Props>) => {
	return (
		<Tooltip>
			<TooltipTrigger>
				<div
					className={cn(
						"flex w-full items-center justify-start gap-3 px-3 py-1 text-left",
						className,
					)}
				>
					{children}
				</div>
			</TooltipTrigger>

			{!!timestamp && (
				<TooltipContent>
					{format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss")}
				</TooltipContent>
			)}
		</Tooltip>
	);
};

export { BaseLog };
