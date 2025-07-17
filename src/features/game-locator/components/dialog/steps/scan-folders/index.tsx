import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FileInfo, ScanStats } from "@/@types";
import { useGameLocator } from "@/features/game-locator/hooks/useGameLocator";
import { useGameLocatorStore } from "@/features/game-locator/stores/gameLocator";
import { trpc } from "@/lib";
import { DiscoveredGames } from "./discovered-games";
import { FolderSelection } from "./folder-selection";
import { ScanProgress } from "./scan-progress";

const INITIAL_STATS: ScanStats = {
	processedDirs: 0,
	processedFiles: 0,
	skippedPaths: 0,
	errors: 0,
	gamesFound: 0,
	progressPercentage: 0,
	estimatedTimeRemaining: 0,
};

export const GameLocatorScanFoldersStep = () => {
	const { setGames } = useGameLocatorStore();
	const {
		scan,
		stop,
		isScanning,
		lastGameDiscoveryEvent,
		lastScanStatsEvent,
		error,
		lastScanResult,
		isInstanceCreated,
	} = useGameLocator({
		autoCreate: true,
		enableProgressUpdates: true,
		enableGameDiscovery: true,
		enableScanStats: true,
	});

	const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
	const [discoveredGames, setDiscoveredGames] = useState<FileInfo[]>([]);
	const [currentStats, setCurrentStats] = useState<ScanStats>(INITIAL_STATS);
	const [isSelectingFolder, setIsSelectingFolder] = useState<boolean>(false);

	const openDialog = trpc.app.openDialog.useMutation();

	useEffect(() => {
		if (lastScanStatsEvent?.stats) {
			setCurrentStats(lastScanStatsEvent.stats);
		}
	}, [lastScanStatsEvent]);

	useEffect(() => {
		if (lastGameDiscoveryEvent?.game) {
			const newGame = lastGameDiscoveryEvent.game;
			const gameWithDate = {
				...newGame,
				lastModified: newGame.lastModified
					? new Date(newGame.lastModified)
					: undefined,
			};
			setDiscoveredGames((prevGames) => [...prevGames, gameWithDate]);
		}
	}, [lastGameDiscoveryEvent]);

	useEffect(() => {
		if (lastScanResult && !isScanning && lastScanResult.success) {
			const result = lastScanResult;
			if ("data" in result && result.data.games) {
				const gamesWithDateConversion = result.data.games.map((game) => ({
					...game,
					lastModified: game.lastModified
						? new Date(game.lastModified)
						: undefined,
				}));
				setGames(gamesWithDateConversion);
				setDiscoveredGames(gamesWithDateConversion);
			}
			toast.success(
				`Scan completed! Found ${"data" in result ? result.data.games.length : 0} games.`,
			);
		}
	}, [lastScanResult, isScanning, setGames]);

	const handleAddFolder = useCallback(async () => {
		if (isSelectingFolder || openDialog.isPending) {
			return;
		}

		try {
			setIsSelectingFolder(true);
			const result = await openDialog.mutateAsync({
				properties: ["openDirectory"],
			});

			if (result.success && !result.canceled && result.filePaths.length > 0) {
				const newPath = result.filePaths[0];
				setSelectedPaths([newPath]);
				toast.success(`Selected folder: ${newPath}`);
			} else if (!result.success && result.message) {
				toast.error(result.message);
			}
		} catch (error) {
			console.error("Folder selection error:", error);
			toast.error("Failed to open folder dialog");
		} finally {
			setIsSelectingFolder(false);
		}
	}, [openDialog, isSelectingFolder]);

	const handleRemoveFolder = useCallback((pathToRemove: string) => {
		setSelectedPaths((prev) => prev.filter((path) => path !== pathToRemove));
	}, []);

	const handleStartScan = useCallback(async () => {
		if (selectedPaths.length === 0) {
			toast.error("Please select a folder to scan");
			return;
		}
		if (!isInstanceCreated) {
			toast.error(
				"Game locator instance not ready. Please wait a moment and try again.",
			);
			return;
		}
		try {
			setDiscoveredGames([]);
			setCurrentStats(INITIAL_STATS);
			await scan({ paths: selectedPaths });
		} catch (scanError) {
			toast.error(
				scanError instanceof Error ? scanError.message : "Scan failed",
			);
		}
	}, [selectedPaths, scan, isInstanceCreated]);

	const handleStopScan = useCallback(async () => {
		try {
			await stop();
			toast.info("Scan stopped");
		} catch {
			toast.error("Failed to stop scan");
		}
	}, [stop]);

	return (
		<div className="flex-1 space-y-6 overflow-y-auto">
			<FolderSelection
				selectedPaths={selectedPaths}
				isScanning={isScanning}
				isSelectingFolder={isSelectingFolder}
				error={error}
				onAddFolder={handleAddFolder}
				onRemoveFolder={handleRemoveFolder}
				onStartScan={handleStartScan}
				onStopScan={handleStopScan}
			/>

			{(isScanning || lastScanResult) && (
				<div className="flex flex-1 flex-col gap-6">
					<ScanProgress stats={currentStats} isScanning={isScanning} />
					<DiscoveredGames games={discoveredGames} isScanning={isScanning} />
				</div>
			)}
		</div>
	);
};
