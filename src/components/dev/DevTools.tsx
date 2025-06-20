import { type ReactElement, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface DevTool {
	name: string;
	icon: ReactElement;
	component: ReactElement;
}

interface FalkorDevToolsProps {
	tools: DevTool[];
}

interface DevToolItemProps {
	tool: DevTool;
	isActive: boolean;
	onToggle: () => void;
	isAnyToolActive: boolean;
}

const DevToolItem = ({
	tool,
	isActive,
	onToggle,
	isAnyToolActive,
}: DevToolItemProps) => {
	const shouldDisableTooltip = isActive || isAnyToolActive;

	return (
		<div className="relative flex justify-end">
			<div
				className={cn(
					"absolute right-full z-[9997] mr-2 rounded-lg border bg-background shadow-lg",
					"bottom-0",
					"max-h-[80vh] max-w-[80vw] overflow-y-auto",
					"transition-all duration-300 ease-in-out",
					isActive
						? "translate-x-0 opacity-100"
						: "pointer-events-none translate-x-4 opacity-0",
				)}
				aria-hidden={!isActive}
				id={`devtools-panel-${tool.name}`}
			>
				{tool.component}
			</div>

			{!shouldDisableTooltip ? (
				<Tooltip delayDuration={100}>
					<TooltipTrigger asChild>
						<Button
							variant={isActive ? "secondary" : "outline"}
							size="icon"
							onClick={onToggle}
							className="h-12 w-12 shrink-0 shadow-lg"
							aria-label={`Toggle ${tool.name} tool`}
							aria-pressed={isActive}
							aria-controls={`devtools-panel-${tool.name}`}
						>
							{tool.icon}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left" className="capitalize">
						{tool.name}
					</TooltipContent>
				</Tooltip>
			) : (
				<Button
					variant={isActive ? "secondary" : "outline"}
					size="icon"
					onClick={onToggle}
					className="h-12 w-12 shrink-0 shadow-lg"
					aria-label={`Toggle ${tool.name} tool`}
					aria-pressed={isActive}
					aria-controls={`devtools-panel-${tool.name}`}
				>
					{tool.icon}
				</Button>
			)}
		</div>
	);
};

const FalkorDevTools = ({ tools }: FalkorDevToolsProps) => {
	const [activeTool, setActiveTool] = useState<string | null>(null);

	const isAnyToolActive = activeTool !== null;

	if (process.env.NODE_ENV !== "development" || tools.length === 0) {
		return null;
	}

	const handleToolToggle = (toolName: string) => {
		setActiveTool((current) => (current === toolName ? null : toolName));
	};

	return (
		<div className="fixed right-4 bottom-4 z-[9996] flex flex-col items-end gap-2">
			{tools.map((tool) => (
				<DevToolItem
					key={tool.name}
					tool={tool}
					isActive={activeTool === tool.name}
					onToggle={() => handleToolToggle(tool.name)}
					isAnyToolActive={isAnyToolActive}
				/>
			))}
		</div>
	);
};

export default FalkorDevTools;
