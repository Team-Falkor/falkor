import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { InputWithIcon } from "@/components/inputWithIcon";
import GameLoader from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import SearchCard from "@/features/search/components/card";
import useSearch from "@/features/search/hooks/useSearch";

export default function SearchDialog() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const { results, loading, error, recentSearches, clearRecent } = useSearch(
		query,
		8,
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="icon" variant={open ? "default" : "ghost"}>
					<SearchIcon />
				</Button>
			</DialogTrigger>
			<DialogContent className="mx-2 my-4 w-full sm:mx-auto sm:max-w-xl max-h-[calc(100vh-4rem)] overflow-y-auto p-0">
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle>Search</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 w-full px-6 pb-6">
					<InputWithIcon
						placeholder="Type to search..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						autoFocus
						startIcon={<SearchIcon className="h-4 w-4 text-muted-foreground" />}
						className="w-full"
					/>

					{/* Recent Searches */}
					{recentSearches.length > 0 && (
						<div className="flex flex-row items-center justify-between w-full gap-2">
							<Carousel
								className="flex-1 overflow-hidden"
								opts={{
									skipSnaps: true,
									dragFree: true,
									loop: false,
								}}
							>
								<CarouselContent>
									{recentSearches.map((search) => (
										<CarouselItem
											key={search}
											// first item should have left padding of 16px or the layout will be off
											className="basis-auto first:pl-4 pl-1 py-1"
										>
											<Button
												key={search}
												size="sm"
												variant="secondary"
												onClick={() => setQuery(search)}
												className="rounded-full px-3 text-xs"
											>
												{search}
											</Button>
										</CarouselItem>
									))}
								</CarouselContent>
							</Carousel>

							<Button
								size="sm"
								onClick={clearRecent}
								className="my-1 ml-2 px-3 text-xs"
								variant="ghost"
							>
								Clear
							</Button>
						</div>
					)}

					{/* Search Results */}
					<div className="space-y-2 mt-2">
						{loading && (
							<div className="flex items-center justify-center py-10">
								<GameLoader />
							</div>
						)}

						{!loading && error && (
							<p className="text-sm text-destructive text-center py-4">
								{error}
							</p>
						)}

						{!loading && !query && (
							<p className="text-sm text-muted-foreground text-center py-4">
								Start typing to search...
							</p>
						)}

						{!loading && query && results.length === 0 && (
							<p className="text-sm text-muted-foreground text-center py-4">
								No results found.
							</p>
						)}

						{!loading && !!results?.length && (
							<div className="flex flex-col gap-2">
								{results.map((game) => (
									<SearchCard {...game} key={game.id} setOpen={setOpen} />
								))}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
