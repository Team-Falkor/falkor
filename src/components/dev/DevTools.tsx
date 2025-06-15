import { type ReactElement, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
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
}

/**
 * Renders a single tool button and its associated panel.
 * The panel is viewport-aware and will not render off-screen.
 */
const DevToolItem = ({ tool, isActive, onToggle }: DevToolItemProps) => {
	return (
		// Relative container for positioning the panel
		<div className="relative flex justify-end">
			{/* Panel for this specific tool */}
			<div
				className={cn(
					// Base styles for the panel
					"absolute right-full mr-2 rounded-lg border bg-background shadow-lg",
					// *** THE KEY CHANGE IS HERE: `top-0` becomes `bottom-0` ***
					"bottom-0",
					// Safety constraints to prevent breaking the viewport
					"max-h-[80vh] max-w-[80vw] overflow-y-auto",
					// Animation styles
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

			{/* Trigger Button */}
			<Tooltip>
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
				<TooltipContent side="left">
					<p>{tool.name}</p>
				</TooltipContent>
			</Tooltip>
		</div>
	);
};

/**
 * Main component that orchestrates the developer tools.
 */
const FalkorDevTools = ({ tools }: FalkorDevToolsProps) => {
	const [activeTool, setActiveTool] = useState<string | null>(null);

	if (process.env.NODE_ENV !== "development" || tools.length === 0) {
		return null;
	}

	const handleToolToggle = (toolName: string) => {
		setActiveTool((current) => (current === toolName ? null : toolName));
	};

	return (
		<TooltipProvider delayDuration={100}>
			<div className="fixed right-4 bottom-4 z-[9999] flex flex-col items-end gap-2">
				{tools.map((tool) => (
					<DevToolItem
						key={tool.name}
						tool={tool}
						isActive={activeTool === tool.name}
						onToggle={() => handleToolToggle(tool.name)}
					/>
				))}
			</div>
		</TooltipProvider>
	);
};

export default FalkorDevTools;
