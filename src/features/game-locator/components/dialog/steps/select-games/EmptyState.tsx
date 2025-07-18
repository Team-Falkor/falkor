import { FolderOpen, RefreshCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	type: "no-games" | "no-results" | "no-selection";
	searchQuery?: string;
	onClearSearch?: () => void;
	onRescan?: () => void;
	className?: string;
}

export const EmptyState = ({
	type,
	searchQuery,
	onClearSearch,
	onRescan,
	className,
}: EmptyStateProps) => {
	const getEmptyStateContent = () => {
		switch (type) {
			case "no-games":
				return {
					icon: <FolderOpen className="h-12 w-12 text-muted-foreground/50" />,
					title: "No games found",
					description:
						"We couldn't find any games in the scanned directories. Try scanning different folders or check your scan settings.",
					action: onRescan && (
						<Button onClick={onRescan} variant="outline" className="mt-4">
							<RefreshCw className="mr-2 h-4 w-4" />
							Scan Again
						</Button>
					),
				};
			case "no-results":
				return {
					icon: <SearchX className="h-12 w-12 text-muted-foreground/50" />,
					title: "No matching games",
					description: searchQuery
						? `No games found matching "${searchQuery}". Try adjusting your search terms or filters.`
						: "No games match the current filters. Try adjusting your filter settings.",
					action: onClearSearch && (
						<Button onClick={onClearSearch} variant="outline" className="mt-4">
							Clear Search
						</Button>
					),
				};
			case "no-selection":
				return {
					icon: <FolderOpen className="h-12 w-12 text-muted-foreground/50" />,
					title: "No games selected",
					description:
						"Select games from the discovered list to add them to your library. Click on game cards or use the selection controls.",
					action: null,
				};
			default:
				return {
					icon: <FolderOpen className="h-12 w-12 text-muted-foreground/50" />,
					title: "Empty",
					description: "Nothing to display",
					action: null,
				};
		}
	};

	const { icon, title, description, action } = getEmptyStateContent();

	return (
		<Card className={cn("border-dashed", className)}>
			<CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
				<div className="mb-4">{icon}</div>
				<h3 className="mb-2 font-semibold text-lg text-muted-foreground">
					{title}
				</h3>
				<p className="max-w-md text-muted-foreground text-sm leading-relaxed">
					{description}
				</p>
				{action}
			</CardContent>
		</Card>
	);
};
