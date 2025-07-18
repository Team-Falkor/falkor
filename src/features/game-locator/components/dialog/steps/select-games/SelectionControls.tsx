import { CheckSquare, Square, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectionControlsProps {
	totalGames: number;
	selectedCount: number;
	onSelectAll: () => void;
	onClearSelection: () => void;
	className?: string;
}

export const SelectionControls = ({
	totalGames,
	selectedCount,
	onSelectAll,
	onClearSelection,
	className,
}: SelectionControlsProps) => {
	const isAllSelected = selectedCount === totalGames && totalGames > 0;
	const hasSelection = selectedCount > 0;

	return (
		<div className={cn("flex items-center justify-between gap-3", className)}>
			{/* Selection Status */}
			<div className="flex items-center gap-2">
				<Badge
					variant={hasSelection ? "default" : "secondary"}
					className={cn(
						"transition-all duration-200",
						hasSelection && "bg-primary text-primary-foreground",
					)}
				>
					{selectedCount} of {totalGames} selected
				</Badge>
				{hasSelection && (
					<span className="text-muted-foreground text-sm">
						{selectedCount === 1 ? "1 game" : `${selectedCount} games`} will be
						added to your library
					</span>
				)}
			</div>

			{/* Action Buttons */}
			<div className="flex items-center gap-2">
				{/* Select/Deselect All Button */}
				<Button
					variant="outline"
					size="sm"
					onClick={isAllSelected ? onClearSelection : onSelectAll}
					disabled={totalGames === 0}
					className="flex items-center gap-2"
				>
					{isAllSelected ? (
						<>
							<Square className="h-4 w-4" />
							Deselect All
						</>
					) : (
						<>
							<CheckSquare className="h-4 w-4" />
							Select All
						</>
					)}
				</Button>

				{/* Clear Selection Button */}
				{hasSelection && (
					<Button
						variant="outline"
						size="sm"
						onClick={onClearSelection}
						className="flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 className="h-4 w-4" />
						Clear
					</Button>
				)}
			</div>
		</div>
	);
};
