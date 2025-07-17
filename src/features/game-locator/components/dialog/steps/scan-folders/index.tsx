import { useCallback, useEffect, useRef, useState } from "react";
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
	const mountedRef = useRef(true);
	const {
		scan,
		stop,
		isScanning,
		gameDiscoveryEvents,
		scanStatsEvents,
		error,
		lastScanResult,
	} = useGameLocator({
		autoCreate: true,
		enableProgressUpdates: true,
		enableGameDiscovery: true,
		enableScanStats: true,
	});

	const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
	const [discoveredGames, setDiscoveredGames] = useState<FileInfo[]>([]);
	const [currentStats, setCurrentStats] = useState<ScanStats>(INITIAL_STATS);

	const openDialog = trpc.app.openDialog.useMutation();

	useEffect(() => {
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (!mountedRef.current || scanStatsEvents.length === 0) return;
		const latestEvent = scanStatsEvents[scanStatsEvents.length - 1];
		setCurrentStats(latestEvent.stats);
	}, [scanStatsEvents]);

	useEffect(() => {
		if (!mountedRef.current || gameDiscoveryEvents.length === 0) return;
		const games = gameDiscoveryEvents
			.filter((event) => event?.game)
			.map((event) => {
				const game = event.game;
				return {
					...game,
					lastModified: game.lastModified
						? new Date(game.lastModified)
						: undefined,
				};
			});
		setDiscoveredGames(games);
	}, [gameDiscoveryEvents]);

	useEffect(() => {
		if (
			mountedRef.current &&
			lastScanResult &&
			!isScanning &&
			lastScanResult.success
		) {
			const result = lastScanResult;
			if ("data" in result && result.data.games) {
				// Convert string lastModified to Date objects to match FileInfo interface
				const gamesWithDateConversion = result.data.games.map((game) => ({
					...game,
					lastModified: game.lastModified
						? new Date(game.lastModified)
						: undefined,
				}));
				setGames(gamesWithDateConversion);
			}
			toast.success(
				`Scan completed! Found ${"data" in result ? result.data.games.length : 0} games.`,
			);
		}
	}, [lastScanResult, isScanning, setGames]);

	const handleAddFolder = useCallback(async () => {
		try {
			const result = await openDialog.mutateAsync({
				properties: ["openDirectory"],
			});
			if (result.success && !result.canceled && result.filePaths.length > 0) {
				const newPath = result.filePaths[0];
				setSelectedPaths((prev) =>
					prev.includes(newPath) ? prev : [...prev, newPath],
				);
			} else if (!result.success && result.message) {
				toast.error(result.message);
			}
		} catch {
			toast.error("Failed to open folder dialog");
		}
	}, [openDialog]);

	const handleRemoveFolder = useCallback((pathToRemove: string) => {
		setSelectedPaths((prev) => prev.filter((path) => path !== pathToRemove));
	}, []);

	const handleStartScan = useCallback(async () => {
		if (selectedPaths.length === 0) {
			toast.error("Please select at least one folder to scan");
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
	}, [selectedPaths, scan]);

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
				error={error}
				onAddFolder={handleAddFolder}
				onRemoveFolder={handleRemoveFolder}
				onStartScan={handleStartScan}
				onStopScan={handleStopScan}
			/>

			{(isScanning || lastScanResult) && (
				<div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
					<ScanProgress stats={currentStats} isScanning={isScanning} />
					<DiscoveredGames games={discoveredGames} isScanning={isScanning} />
				</div>
			)}
		</div>
	);
};
