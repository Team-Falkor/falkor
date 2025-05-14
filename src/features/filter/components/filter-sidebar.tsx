import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { RouterInputs } from "@/@types";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib";

export type FilterOptions = RouterInputs["igdb"]["filter"]["options"];

interface FilterSidebarProps {
	initialFilters: FilterOptions;
}

// Generic factory for date/number range handlers
function makeRangeHandler<
	OP extends Record<string, any>,
	K1 extends keyof OP,
	K2 extends keyof OP,
>(
	setFilters: React.Dispatch<React.SetStateAction<OP>>,
	fromKey: K1,
	toKey: K2,
) {
	return (range: { from?: Date; to?: Date }) => {
		setFilters(
			(prev) =>
				({
					...prev,
					[fromKey]:
						range.from instanceof Date ? range.from.getTime() : prev[fromKey],
					[toKey]: range.to instanceof Date ? range.to.getTime() : prev[toKey],
				}) as OP,
		);
	};
}

export function FilterSidebar({ initialFilters }: FilterSidebarProps) {
	const navigate = useNavigate();
	const [filters, setFilters] = useState<FilterOptions>(initialFilters);

	// Platforms list
	const platforms = [
		{ id: 6, name: "PC" },
		{ id: 48, name: "Mac" },
		{ id: 49, name: "Linux" },
	];

	// Data queries
	const { data: genresList = [], isLoading: genresLoading } =
		trpc.igdb.genres.useQuery({ limit: 50, offset: 0 });
	const { data: themesList = [], isLoading: themesLoading } =
		trpc.igdb.themes.useQuery({ limit: 50, offset: 0 });

	// Handlers
	const handleRatingChange = (value: number[]) => {
		setFilters((prev) => ({
			...prev,
			minRating: value[0],
			maxRating: value[1],
		}));
	};

	const handleReleaseDateChange = makeRangeHandler<
		FilterOptions,
		"releaseDateFrom",
		"releaseDateTo"
	>(setFilters, "releaseDateFrom", "releaseDateTo");

	const handlePlatformToggle = (id: number) => {
		setFilters((prev) => {
			const list = prev.platforms ?? [];
			return {
				...prev,
				platforms: list.includes(id)
					? list.filter((p) => p !== id)
					: [...list, id],
			};
		});
	};

	const handleGenreToggle = (id: number) => {
		setFilters((prev) => {
			const list = prev.genreIds ?? [];
			return {
				...prev,
				genreIds: list.includes(id)
					? list.filter((g) => g !== id)
					: [...list, id],
			};
		});
	};

	const handleThemeToggle = (id: number) => {
		setFilters((prev) => {
			const list = prev.themes ?? [];
			return {
				...prev,
				themes: list.includes(id)
					? list.filter((t) => t !== id)
					: [...list, id],
			};
		});
	};

	const handleExcludeVersionsChange = (checked: boolean) => {
		setFilters((prev) => ({ ...prev, excludeVersions: checked }));
	};

	const handleApplyFilters = () => {
		navigate({
			to: "/filter",
			search: (prev) => ({
				...prev,
				...filters,
				offset: 0,
			}),
		});
	};

	const handleResetFilters = () => {
		setFilters({} as FilterOptions);
		navigate({ to: "/filter", search: {} });
	};

	return (
		<Card className="w-full space-y-6 rounded-2xl p-4 shadow-md">
			<div className="space-y-1">
				<h3 className="font-bold text-lg tracking-tight">Filters</h3>
				<p className="text-muted-foreground text-sm">Refine your game search</p>
			</div>
			<div className="w-full space-y-6 overflow-hidden">
				{/* Rating Range */}
				<Collapsible defaultOpen>
					<CollapsibleTrigger className="flex w-full items-center justify-between">
						<Label className="font-medium">Rating Range</Label>
						<ChevronDown className="h-4 w-4" />
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-3 pt-4">
						<Slider
							defaultValue={[filters.minRating ?? 0, filters.maxRating ?? 100]}
							min={0}
							max={100}
							step={1}
							onValueChange={handleRatingChange}
						/>
						<div className="flex justify-between text-muted-foreground text-xs">
							<span>{(filters.minRating ?? 0) / 10}</span>
							<span>{(filters.maxRating ?? 100) / 10}</span>
						</div>
					</CollapsibleContent>
				</Collapsible>

				{/* Release Date */}
				<Collapsible defaultOpen>
					<CollapsibleTrigger className="flex w-full items-center justify-between">
						<Label className="font-medium">Release Date</Label>
						<ChevronDown className="h-4 w-4" />
					</CollapsibleTrigger>
					<CollapsibleContent className="flex justify-between gap-2 pt-3">
						<DatePicker
							value={
								filters.releaseDateFrom
									? new Date(filters.releaseDateFrom)
									: undefined
							}
							onChange={(d) =>
								handleReleaseDateChange({
									from: d,
									to: filters.releaseDateTo
										? new Date(filters.releaseDateTo)
										: undefined,
								})
							}
							placeholder="From"
							className="flex-1"
						/>
						<DatePicker
							value={
								filters.releaseDateTo
									? new Date(filters.releaseDateTo)
									: undefined
							}
							onChange={(d) =>
								handleReleaseDateChange({
									from: filters.releaseDateFrom
										? new Date(filters.releaseDateFrom)
										: undefined,
									to: d,
								})
							}
							placeholder="To"
							className="flex-1"
						/>
					</CollapsibleContent>
				</Collapsible>

				{/* Platforms */}
				<Collapsible defaultOpen>
					<CollapsibleTrigger className="flex w-full items-center justify-between">
						<Label className="font-medium">
							Platforms
							{filters.platforms?.length ? (
								<span className="ml-1 text-muted-foreground text-xs">
									({filters.platforms.length})
								</span>
							) : null}
						</Label>
						<ChevronDown className="h-4 w-4" />
					</CollapsibleTrigger>
					<CollapsibleContent className="max-w-full pt-3">
						<div className="flex max-w-full flex-wrap gap-2">
							{platforms.map((plat) => (
								<Button
									key={plat.id}
									variant={
										filters.platforms?.includes(plat.id) ? "active" : "outline"
									}
									size="sm"
									className="min-w-fit rounded-full"
									onClick={() => handlePlatformToggle(plat.id)}
								>
									{plat.name}
								</Button>
							))}
						</div>
					</CollapsibleContent>
				</Collapsible>

				{/* Genres */}
				<Collapsible defaultOpen>
					<CollapsibleTrigger className="flex w-full items-center justify-between">
						<Label className="font-medium">
							Genres
							{filters.genreIds?.length ? (
								<span className="ml-1 text-muted-foreground text-xs">
									({filters.genreIds.length})
								</span>
							) : null}
						</Label>
						<ChevronDown className="h-4 w-4" />
					</CollapsibleTrigger>
					<CollapsibleContent className="max-w-full pt-3">
						{genresLoading ? (
							<div>Loading genres...</div>
						) : (
							<div className="flex max-w-full flex-wrap gap-2">
								{genresList.map((g) => (
									<Button
										key={g.id}
										variant={
											filters.genreIds?.includes(g.id) ? "active" : "outline"
										}
										size="sm"
										className="min-w-fit rounded-full"
										onClick={() => handleGenreToggle(g.id)}
									>
										{g.name}
									</Button>
								))}
							</div>
						)}
					</CollapsibleContent>
				</Collapsible>

				{/* Themes */}
				<Collapsible defaultOpen>
					<CollapsibleTrigger className="flex w-full items-center justify-between">
						<Label className="font-medium">
							Themes
							{filters.themes?.length ? (
								<span className="ml-1 text-muted-foreground text-xs">
									({filters.themes.length})
								</span>
							) : null}
						</Label>
						<ChevronDown className="h-4 w-4" />
					</CollapsibleTrigger>
					<CollapsibleContent className="max-w-full pt-3">
						{themesLoading ? (
							<div>Loading themes...</div>
						) : (
							<div className="flex max-w-full flex-wrap gap-2">
								{themesList.map((t) => (
									<Button
										key={t.id}
										variant={
											filters.themes?.includes(t.id) ? "active" : "outline"
										}
										size="sm"
										className="max-w-full overflow-hidden break-words rounded-full"
										onClick={() => handleThemeToggle(t.id)}
									>
										<span className="w-full truncate">{t.name}</span>
									</Button>
								))}
							</div>
						)}
					</CollapsibleContent>
				</Collapsible>

				{/* Exclude Versions */}
				<div className="flex items-center justify-between">
					<Label htmlFor="exclude-versions" className="font-medium">
						Exclude Versions
					</Label>
					<Switch
						id="exclude-versions"
						checked={!!filters.excludeVersions}
						onCheckedChange={handleExcludeVersionsChange}
					/>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col gap-2">
					<Button onClick={handleApplyFilters} className="w-full">
						Apply Filters
					</Button>
					<Button
						variant="outline"
						onClick={handleResetFilters}
						className="w-full"
					>
						Reset
					</Button>
				</div>
			</div>
		</Card>
	);
}
