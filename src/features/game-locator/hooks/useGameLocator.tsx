import { useCallback, useEffect, useRef, useState } from "react";
import type { RouterInputs, RouterOutputs } from "@/@types";
import { trpc } from "@/lib/trpc";

type ScanInput = RouterInputs["gameLocator"]["scan"];
type ScanResult = RouterOutputs["gameLocator"]["scan"];
type ScanOptions = RouterInputs["gameLocator"]["updateOptions"]["options"];
type CreateInstanceInput = RouterInputs["gameLocator"]["createInstance"];
type GetOptionsResult = RouterOutputs["gameLocator"]["getOptions"];
type ScanProgressSubscription = RouterOutputs["gameLocator"]["scanProgress"];
type GameDiscoverySubscription = RouterOutputs["gameLocator"]["gameDiscovery"];
type ScanStatsSubscription = RouterOutputs["gameLocator"]["scanStats"];
type ScanProgressEvent = ScanProgressSubscription;
type GameDiscoveryEvent = GameDiscoverySubscription;
type ScanStatsEvent = ScanStatsSubscription;

export interface UseGameLocatorOptions {
	/**
	 * Whether to automatically create a GameLocator instance on mount
	 */
	autoCreate?: boolean;
	/**
	 * Whether to enable real-time progress updates
	 */
	enableProgressUpdates?: boolean;
	/**
	 * Whether to enable game discovery events
	 */
	enableGameDiscovery?: boolean;
	/**
	 * Whether to enable scan statistics updates
	 */
	enableScanStats?: boolean;
}

export interface UseGameLocatorReturn {
	// Scan operations
	scan: (input: ScanInput) => Promise<ScanResult>;
	stop: () => Promise<RouterOutputs["gameLocator"]["stop"]>;
	isScanning: boolean;

	// Instance management
	createInstance: (
		options?: CreateInstanceInput,
	) => Promise<RouterOutputs["gameLocator"]["createInstance"]>;
	resetInstance: () => Promise<RouterOutputs["gameLocator"]["resetInstance"]>;

	// Options management
	updateOptions: (
		options: ScanOptions,
	) => Promise<RouterOutputs["gameLocator"]["updateOptions"]>;
	getOptions: () => Promise<GetOptionsResult | undefined>;
	getCommonGameDirectories: () => Promise<string[]>;

	// Real-time events
	progressEvents: ScanProgressEvent[];
	gameDiscoveryEvents: GameDiscoveryEvent[];
	scanStatsEvents: ScanStatsEvent[];

	// Event handlers
	onProgressEvent: (handler: (event: ScanProgressEvent) => void) => () => void;
	onGameDiscovery: (handler: (event: GameDiscoveryEvent) => void) => () => void;
	onScanStats: (handler: (event: ScanStatsEvent) => void) => () => void;

	// State
	isInstanceCreated: boolean;
	error: string | null;
	lastScanResult: ScanResult | null;
}

export function useGameLocator(
	options: UseGameLocatorOptions = {},
): UseGameLocatorReturn {
	const {
		autoCreate = true,
		enableProgressUpdates = true,
		enableGameDiscovery = true,
		enableScanStats = true,
	} = options;

	// State
	const [isInstanceCreated, setIsInstanceCreated] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
	const [progressEvents, setProgressEvents] = useState<ScanProgressEvent[]>([]);
	const [gameDiscoveryEvents, setGameDiscoveryEvents] = useState<
		GameDiscoveryEvent[]
	>([]);
	const [scanStatsEvents, setScanStatsEvents] = useState<ScanStatsEvent[]>([]);

	// Event handlers refs
	const progressHandlers = useRef<Set<(event: ScanProgressEvent) => void>>(
		new Set(),
	);
	const gameDiscoveryHandlers = useRef<
		Set<(event: GameDiscoveryEvent) => void>
	>(new Set());
	const scanStatsHandlers = useRef<Set<(event: ScanStatsEvent) => void>>(
		new Set(),
	);

	// tRPC hooks
	const scanMutation = trpc.gameLocator.scan.useMutation({
		onSuccess: (data) => {
			setLastScanResult(data);
			setError(null);
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	const stopMutation = trpc.gameLocator.stop.useMutation({
		onError: (error) => {
			setError(error.message);
		},
	});

	const createInstanceMutation = trpc.gameLocator.createInstance.useMutation({
		onSuccess: () => {
			setIsInstanceCreated(true);
			setError(null);
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	const resetInstanceMutation = trpc.gameLocator.resetInstance.useMutation({
		onSuccess: () => {
			setIsInstanceCreated(false);
			setError(null);
			// Clear events when instance is reset
			setProgressEvents([]);
			setGameDiscoveryEvents([]);
			setScanStatsEvents([]);
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	const updateOptionsMutation = trpc.gameLocator.updateOptions.useMutation({
		onError: (error) => {
			setError(error.message);
		},
	});

	const getOptionsQuery = trpc.gameLocator.getOptions.useQuery(undefined, {
		enabled: isInstanceCreated,
	});

	const getCommonGameDirectoriesQuery =
		trpc.gameLocator.getCommonGameDirectories.useQuery();

	const isScanningQuery = trpc.gameLocator.isScanning.useQuery(undefined, {
		enabled: isInstanceCreated,
		refetchInterval: 1000, // Poll every second when scanning
	});

	// Subscriptions
	trpc.gameLocator.scanProgress.useSubscription(undefined, {
		enabled: enableProgressUpdates && isInstanceCreated,
		onData: (event) => {
			setProgressEvents((prev) => [...prev, event]);
			// Notify handlers
			progressHandlers.current.forEach((handler) => handler(event));
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	trpc.gameLocator.gameDiscovery.useSubscription(undefined, {
		enabled: enableGameDiscovery && isInstanceCreated,
		onData: (event) => {
			setGameDiscoveryEvents((prev) => [...prev, event]);
			// Notify handlers
			gameDiscoveryHandlers.current.forEach((handler) => handler(event));
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	trpc.gameLocator.scanStats.useSubscription(undefined, {
		enabled: enableScanStats && isInstanceCreated,
		onData: (event) => {
			setScanStatsEvents((prev) => [...prev, event]);
			// Notify handlers
			scanStatsHandlers.current.forEach((handler) => handler(event));
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	// Auto-create instance on mount
	useEffect(() => {
		if (autoCreate && !isInstanceCreated) {
			createInstanceMutation.mutate({});
		}
	}, [autoCreate, isInstanceCreated, createInstanceMutation]);

	// Methods
	const scan = useCallback(
		async (input: ScanInput): Promise<ScanResult> => {
			if (!isInstanceCreated) {
				throw new Error(
					"GameLocator instance not created. Call createInstance() first.",
				);
			}
			return scanMutation.mutateAsync(input);
		},
		[isInstanceCreated, scanMutation],
	);

	const stop = useCallback(async (): Promise<
		RouterOutputs["gameLocator"]["stop"]
	> => {
		if (!isInstanceCreated) {
			throw new Error("GameLocator instance not created.");
		}
		return stopMutation.mutateAsync();
	}, [isInstanceCreated, stopMutation]);

	const createInstance = useCallback(
		async (
			options: CreateInstanceInput = {},
		): Promise<RouterOutputs["gameLocator"]["createInstance"]> => {
			return createInstanceMutation.mutateAsync(options);
		},
		[createInstanceMutation],
	);

	const resetInstance = useCallback(async (): Promise<
		RouterOutputs["gameLocator"]["resetInstance"]
	> => {
		return resetInstanceMutation.mutateAsync();
	}, [resetInstanceMutation]);

	const updateOptions = useCallback(
		async (
			options: ScanOptions,
		): Promise<RouterOutputs["gameLocator"]["updateOptions"]> => {
			if (!isInstanceCreated) {
				throw new Error("GameLocator instance not created.");
			}
			return updateOptionsMutation.mutateAsync({ options });
		},
		[isInstanceCreated, updateOptionsMutation],
	);

	const getOptions = useCallback(async () => {
		if (!isInstanceCreated) {
			throw new Error("GameLocator instance not created.");
		}
		return getOptionsQuery.refetch().then((result) => result.data);
	}, [isInstanceCreated, getOptionsQuery]);

	const getCommonGameDirectories = useCallback(async (): Promise<string[]> => {
		return getCommonGameDirectoriesQuery
			.refetch()
			.then((result) => result.data?.directories || []);
	}, [getCommonGameDirectoriesQuery]);

	// Event handler registration
	const onProgressEvent = useCallback(
		(handler: (event: ScanProgressEvent) => void) => {
			progressHandlers.current.add(handler);
			return () => {
				progressHandlers.current.delete(handler);
			};
		},
		[],
	);

	const onGameDiscovery = useCallback(
		(handler: (event: GameDiscoveryEvent) => void) => {
			gameDiscoveryHandlers.current.add(handler);
			return () => {
				gameDiscoveryHandlers.current.delete(handler);
			};
		},
		[],
	);

	const onScanStats = useCallback(
		(handler: (event: ScanStatsEvent) => void) => {
			scanStatsHandlers.current.add(handler);
			return () => {
				scanStatsHandlers.current.delete(handler);
			};
		},
		[],
	);

	return {
		// Scan operations
		scan,
		stop,
		isScanning: isScanningQuery.data?.isScanning || false,

		// Instance management
		createInstance,
		resetInstance,

		// Options management
		updateOptions,
		getOptions,
		getCommonGameDirectories,

		// Real-time events
		progressEvents,
		gameDiscoveryEvents,
		scanStatsEvents,

		// Event handlers
		onProgressEvent,
		onGameDiscovery,
		onScanStats,

		// State
		isInstanceCreated,
		error,
		lastScanResult,
	};
}

// Convenience hooks for specific use cases
export function useGameScanner() {
	return useGameLocator({
		autoCreate: true,
		enableProgressUpdates: true,
		enableGameDiscovery: true,
		enableScanStats: false,
	});
}

export function useGameDiscovery() {
	return useGameLocator({
		autoCreate: true,
		enableProgressUpdates: false,
		enableGameDiscovery: true,
		enableScanStats: false,
	});
}

export function useScanProgress() {
	return useGameLocator({
		autoCreate: true,
		enableProgressUpdates: true,
		enableGameDiscovery: false,
		enableScanStats: true,
	});
}
