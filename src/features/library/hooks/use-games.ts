import { trpc } from "@/lib";

export function useGames(active?: boolean) {
	const utils = trpc.useUtils();

	const {
		data: games,
		isPending: isLoading,
		error,
	} = trpc.library.list.useQuery({
		limit: 100,
		offset: 0,
	});

	const { mutate: deleteGame } = trpc.library.delete.useMutation({
		onSuccess: () => {
			utils.library.list.invalidate(undefined, { refetchType: "all" });
		},
	});

	const { mutate: updateGame } = trpc.library.update.useMutation({
		onSuccess: () => {
			utils.library.list.invalidate(undefined, { refetchType: "all" });
		},
	});

	const { mutate: createGame } = trpc.library.create.useMutation({
		onSuccess: () => {
			utils.library.list.invalidate(undefined, { refetchType: "all" });
		},
	});

	const fetchGames = () => {
		utils.library.list.invalidate(undefined, { refetchType: "all" });
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
