import { trpc } from "@/lib";

export function useGames() {
	const utils = trpc.useUtils();

	const {
		data: games,
		isPending: isLoading,
		error,
	} = trpc.library.list.useQuery(
		{
			limit: 100,
			offset: 0,
		},
		{
			enabled: true,
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchInterval: 1000 * 30, // 30 seconds
			refetchOnMount: true,
			refetchOnReconnect: true,
			refetchOnWindowFocus: true,
		},
	);

	const { mutate: deleteGame } = trpc.library.delete.useMutation({
		onSuccess: async () => {
			await utils.library.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
			await utils.lists.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	const { mutate: updateGame } = trpc.library.update.useMutation({
		onSuccess: async () => {
			await utils.library.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
			await utils.lists.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	const { mutate: createGame } = trpc.library.create.useMutation({
		onSuccess: async () => {
			await utils.library.list.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});
		},
	});

	const fetchGames = async () => {
		await utils.library.invalidate(undefined, {
			refetchType: "all",
			type: "all",
		});
		await utils.lists.invalidate(undefined, {
			refetchType: "all",
			type: "all",
		});
	};

	return {
		games: games || [],
		isLoading,
		error,
		deleteGame,
		updateGame,
		createGame,
		fetchGames,
	};
}
