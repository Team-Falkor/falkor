import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib";
import { getInfoHashFromMagnet } from "@/lib/utils";
import type { PluginSearchResponse } from "@team-falkor/shared-types";

export type CacheStatus = "checking" | "cached" | "not_cached" | "unsupported";

export interface UseCacheStatusesResult {
	cacheStatuses: Record<string, CacheStatus>;
	hasAnyAccount: boolean;
	isChecking: boolean;
}

export function useCacheStatuses(
	sources: PluginSearchResponse[],
	torboxAccount?: { accessToken: string },
): UseCacheStatusesResult {
	const [cacheStatuses, setCacheStatuses] = useState<
		Record<string, CacheStatus>
	>({});
	const [hasChecked, setHasChecked] = useState(false);

	const availabilityMutation =
		trpc.torbox.torrents.instantAvailability.useMutation();

	const checkAvailability = useCallback(
		async (hashes: string[], apiKey: string, magnetUrls: string[]) => {
			try {
				const result = await availabilityMutation.mutateAsync({
					apiKey,
					hashes,
				});
				const newStatuses: Record<string, "cached" | "not_cached"> = {};
				magnetUrls.forEach((url) => {
					const hash = getInfoHashFromMagnet(url);
					const isCached =
						!!hash &&
						result.some((t) => t.hash.toLowerCase() === hash.toLowerCase());
					newStatuses[url] = isCached ? "cached" : "not_cached";
				});
				setCacheStatuses((prev) => ({ ...prev, ...newStatuses }));
			} catch {
				const errorStatuses: Record<string, "unsupported"> = {};
				magnetUrls.forEach((url) => {
					errorStatuses[url] = "unsupported";
				});
				setCacheStatuses((prev) => ({ ...prev, ...errorStatuses }));
			}
		},
		[availabilityMutation],
	);

	useEffect(() => {
		if (!sources.length || hasChecked) return;

		const allUrls = sources.map((s) => s.return).filter(Boolean) as string[];
		if (!torboxAccount) {
			const unsupported: Record<string, "unsupported"> = {};
			allUrls.forEach((url) => {
				unsupported[url] = "unsupported";
			});
			setCacheStatuses(unsupported);
			return;
		}

		const magnetUrls = allUrls.filter((u) => u.startsWith("magnet:"));
		const nonMagnet = allUrls.filter((u) => !u.startsWith("magnet:"));
		if (nonMagnet.length) {
			const unsupported: Record<string, "unsupported"> = {};
			nonMagnet.forEach((url) => {
				unsupported[url] = "unsupported";
			});
			setCacheStatuses((prev) => ({ ...prev, ...unsupported }));
		}

		if (magnetUrls.length && torboxAccount.accessToken) {
			const initial: Record<string, "checking"> = {};
			magnetUrls.forEach((url) => {
				initial[url] = "checking";
			});
			setCacheStatuses(initial);
			const hashes = magnetUrls
				.map((u) => getInfoHashFromMagnet(u))
				.filter(Boolean) as string[];
			checkAvailability(hashes, torboxAccount.accessToken, magnetUrls);
			setHasChecked(true);
		}
	}, [sources, torboxAccount, checkAvailability, hasChecked]);

	const hasAnyAccount = Boolean(torboxAccount);
	const isChecking = Object.values(cacheStatuses).some((s) => s === "checking");

	return { cacheStatuses, hasAnyAccount, isChecking };
}
