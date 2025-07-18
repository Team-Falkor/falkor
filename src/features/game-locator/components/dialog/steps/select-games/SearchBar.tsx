import { Filter, Search, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	sortBy: "name" | "size";
	onSortChange: (sortBy: "name" | "size") => void;
	totalGames: number;
	filteredGames: number;
	className?: string;
}

export const SearchBar = ({
	searchQuery,
	onSearchChange,
	sortBy,
	onSortChange,
	totalGames,
	filteredGames,
	className,
}: SearchBarProps) => {
	const [showSortOptions, setShowSortOptions] = useState(false);

	const sortOptions = [
		{ value: "name" as const, label: "Name" },
		{ value: "size" as const, label: "Size" },
	];

	return (
		<div className={cn("space-y-3", className)}>
			{/* Search Input */}
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search games by name or path..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pr-20 pl-10"
				/>
				<div className="-translate-y-1/2 absolute top-1/2 right-2 flex transform items-center gap-1">
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onSearchChange("")}
							className="h-6 w-6 p-0 hover:bg-muted"
						>
							<X className="h-3 w-3" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowSortOptions(!showSortOptions)}
						className={cn(
							"h-6 w-6 p-0 hover:bg-muted",
							showSortOptions && "bg-muted",
						)}
					>
						<Filter className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{/* Sort Options */}
			{showSortOptions && (
				<div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3">
					<span className="mr-2 font-medium text-muted-foreground text-sm">
						Sort by:
					</span>
					{sortOptions.map((option) => (
						<Badge
							key={option.value}
							variant={sortBy === option.value ? "default" : "outline"}
							className="cursor-pointer transition-colors hover:bg-primary/10"
							onClick={() => onSortChange(option.value)}
						>
							{option.label}
						</Badge>
					))}
				</div>
			)}

			{/* Results Summary */}
			<div className="text-muted-foreground text-sm">
				{searchQuery ? (
					<span>
						Showing {filteredGames} of {totalGames} games for "{searchQuery}"
					</span>
				) : (
					<span>
						Showing all {totalGames} games
					</span>
				)}
			</div>
		</div>
	);
};
