import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Game, IGDBReturnDataType } from "@/@types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TypographyMuted } from "@/components/ui/typography";
import { useManualGameSelectionStore } from "@/features/game-locator/stores/manualGameSelection";
import type { GameFileMatchResult } from "@/features/game-locator/types";
import { GameForm } from "@/features/library/components/game-form";
import { GameResultCard } from "@/features/library/components/modals/new-game/steps/display-results/card";
import useSearch from "@/features/search/hooks/useSearch";
import { getSteamIdFromWebsites, trpc } from "@/lib";

interface ManualGameSelectionFormProps {
	currentGame: GameFileMatchResult;
}

export const ManualGameSelectionForm = ({
	currentGame,
}: ManualGameSelectionFormProps) => {
	const { moveToNextGame } = useManualGameSelectionStore();
	const utils = trpc.useUtils();

	// State for the game search and selection
	const [searchQuery, setSearchQuery] = useState(
		currentGame.file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
	);
	const [selectedGame, setSelectedGame] = useState<IGDBReturnDataType | null>(
		null,
	);

	// State for the game form
	const [gameData, setGameData] = useState<Partial<Game>>({
		gameName: currentGame.file.name.replace(/\.[^/.]+$/, ""),
		gamePath: currentGame.file.path,
		installed: true,
		runAsAdmin: false,
	});

	// Search for games
	const { results, loading, error } = useSearch(searchQuery, {
		enableRecentSearches: false,
		limit: 10,
	});

	// Handle game selection from search results
	const handleGameSelection = useCallback(
		(selected: IGDBReturnDataType) => {
			setSelectedGame(selected);

			const steamId = getSteamIdFromWebsites(selected.websites);
			const gameUpdate: Partial<Game> = {
				gameName: selected.name,
				gameIcon: selected.cover
					? `https://images.igdb.com/igdb/image/upload/t_thumb/${selected.cover.image_id}.png`
					: undefined,
				igdbId: selected.id,
				gameSteamId: steamId,
				gamePath: currentGame.file.path,
				installed: true,
			};
			setGameData((prev) => ({ ...prev, ...gameUpdate }));
		},
		[currentGame.file.path],
	);

	// Auto-select the first result when results load
	useEffect(() => {
		if (!loading && results && results.length > 0 && !selectedGame) {
			handleGameSelection(results[0]);
		}
	}, [results, loading, handleGameSelection, selectedGame]);

	// Handle game data changes in the form
	const handleGameChange = useCallback((updatedFields: Partial<Game>) => {
		setGameData((prev) => ({ ...prev, ...updatedFields }));
	}, []);

	// Handle file browsing in the form
	const openDialog = trpc.app.openDialog.useMutation();
	const handleFileBrowse = useCallback(
		async (
			config: {
				properties: ("openFile" | "openDirectory")[];
				filters: { name: string; extensions: string[] }[];
			},
			updateKey: keyof Game,
		) => {
			try {
				const selected = await openDialog.mutateAsync(config);
				if (selected.canceled) return;

				if (!selected.success || selected.filePaths.length === 0) return;

				const path = selected.filePaths[0];
				setGameData((prev) => ({ ...prev, [updateKey]: path }));
			} catch (error) {
				console.error("Error opening file dialog:", error);
			}
		},
		[openDialog],
	);

	// Create game mutation
	const { mutate: createGame, isPending: isCreating } =
		trpc.library.create.useMutation({
			onSuccess: async (data) => {
				if (!data) {
					toast.error("Error creating game");
					return;
				}

				await utils.library.invalidate(undefined, {
					refetchType: "all",
					type: "all",
				});

				toast.success(`${gameData.gameName} added to library!`);

				// Move to the next game
				moveToNextGame();
			},
			onError: (error) => {
				toast.error("Error adding game to library", {
					description: error.message,
				});
			},
		});

	// Handle saving the game
	const handleSaveGame = () => {
		if (!gameData.gameName) {
			toast.error("Game name is required");
			return;
		}

		createGame({
			gameName: gameData.gameName,
			gamePath: gameData.gamePath || "",
			gameArgs: gameData.gameArgs ?? undefined,
			gameIcon: gameData.gameIcon ?? undefined,
			gameCommand: gameData.gameCommand ?? undefined,
			igdbId: gameData.igdbId ?? undefined,
			gameSteamId: gameData.gameSteamId ?? undefined,
			installed: !!gameData.gamePath,
			winePrefixFolder: gameData.winePrefixFolder ?? undefined,
			runAsAdmin: gameData.runAsAdmin || false,
		});
	};

	// Handle skipping this game
	const handleSkipGame = () => {
		moveToNextGame();
		toast.info(`Skipped ${currentGame.file.name}`);
	};

	return (
		<div className="flex h-full w-full flex-col gap-4 overflow-hidden py-4">
			{/* Search Section */}
			<Card>
				<CardHeader>
					<CardTitle>Search for Game</CardTitle>
				</CardHeader>
				<CardContent>
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search for a game"
						className="mb-4 w-full"
					/>

					<div className="flex max-h-60 w-full flex-1 flex-col gap-2 overflow-y-auto p-1">
						{loading && (
							<div className="p-4 text-center">Loading results...</div>
						)}
						{error && (
							<div className="p-4 text-center text-destructive">
								An error occurred while searching.
							</div>
						)}
						{!loading && results?.length === 0 && (
							<div className="p-4 text-center text-muted-foreground">
								No results found for "{searchQuery}". You can adjust details
								below.
							</div>
						)}
						{(results ?? []).map((result) => (
							<GameResultCard
								key={result.id}
								result={result}
								isSelected={selectedGame?.id === result.id}
								onClick={() => handleGameSelection(result)}
							/>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Game Form Section */}
			<Card className="flex-1 overflow-y-auto">
				<CardHeader>
					<CardTitle>Game Details</CardTitle>
					<TypographyMuted>
						Review and adjust the game details before adding to your library
					</TypographyMuted>
				</CardHeader>
				<CardContent>
					<GameForm
						game={gameData}
						onGameChange={handleGameChange}
						onFileBrowse={handleFileBrowse}
					/>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex justify-between pt-4">
				<Button variant="outline" onClick={handleSkipGame}>
					Skip This Game
				</Button>
				<Button onClick={handleSaveGame} disabled={isCreating}>
					{isCreating ? (
						<>
							<div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
							Saving...
						</>
					) : (
						"Save & Continue"
					)}
				</Button>
			</div>
		</div>
	);
};
