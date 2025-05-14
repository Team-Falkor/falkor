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
			<DialogContent className="mx-2 my-4 max-h-[calc(100vh-4rem)] w-full overflow-y-auto p-0 sm:mx-auto sm:max-w-xl">
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle>Search</DialogTitle>
				</DialogHeader>

				<div className="w-full space-y-4 px-6 pb-6">
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
						<div className="flex w-full flex-row items-center justify-between gap-2">
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
											className="basis-auto py-1 pl-1 first:pl-4"
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
					<div className="mt-2 space-y-2">
						{loading && (
							<div className="flex items-center justify-center py-10">
								<GameLoader />
							</div>
						)}

						{!loading && error && (
							<p className="py-4 text-center text-destructive text-sm">
								{error}
							</p>
						)}

						{!loading && !query && (
							<p className="py-4 text-center text-muted-foreground text-sm">
								Start typing to search...
							</p>
						)}

						{!loading && query && results.length === 0 && (
							<p className="py-4 text-center text-muted-foreground text-sm">
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
