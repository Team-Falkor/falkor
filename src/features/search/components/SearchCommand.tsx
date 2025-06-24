import { useNavigate } from "@tanstack/react-router";
import { History, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import useSearch from "@/features/search/hooks/useSearch";
import SearchResultItem from "./SearchResultItem";
import SearchSpinner from "./SearchSpinner";

export default function SearchCommand() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const navigate = useNavigate();

	const { results, loading, recentSearches, clearRecent } = useSearch(query, {
		limit: 10,
		enableRecentSearches: true,
	});

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const handleSelectGame = (id: number) => {
		navigate({ to: "/info/$id", params: { id: id.toString() } });
		setOpen(false);
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen) {
			setQuery("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					size="icon"
					variant="ghost"
					className="focus-states:bg-muted"
					aria-label="Open search"
				>
					<SearchIcon />
				</Button>
			</DialogTrigger>
			<DialogContent className="h-3/4 max-w-2xl p-0">
				<Command shouldFilter={false} className="flex h-full flex-col">
					<CommandInput
						placeholder="Type to search for a game..."
						value={query}
						onValueChange={setQuery}
					/>
					<CommandList className="h-full max-h-full flex-1 overflow-y-auto">
						{loading && <SearchSpinner />}

						{!loading && query && results.length === 0 && (
							<CommandEmpty>No results found.</CommandEmpty>
						)}

						{!loading && !query && recentSearches.length > 0 && (
							<CommandGroup heading="Recent">
								{recentSearches.map((search) => (
									<CommandItem
										key={search}
										onSelect={() => setQuery(search)}
										className="cursor-pointer"
									>
										<History className="mr-2 h-4 w-4" />
										<span>{search}</span>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{!loading && results.length > 0 && (
							<CommandGroup heading="Results">
								{results.map((game) => (
									<SearchResultItem
										key={game.id}
										game={game}
										onSelect={() => handleSelectGame(game.id)}
									/>
								))}
							</CommandGroup>
						)}
					</CommandList>

					{!loading && !query && recentSearches.length > 0 && (
						<>
							<CommandSeparator />
							<div className="p-2">
								<Button
									onClick={clearRecent}
									variant="ghost"
									size="sm"
									className="w-full text-muted-foreground"
								>
									Clear recent searches
								</Button>
							</div>
						</>
					)}
				</Command>
			</DialogContent>
		</Dialog>
	);
}
