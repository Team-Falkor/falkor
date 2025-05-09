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
			utils.library.list.invalidate();
		},
	});

	const { mutate: updateGame } = trpc.library.update.useMutation({
		onSuccess: () => {
			utils.library.list.invalidate();
		},
	});

	const { mutate: createGame } = trpc.library.create.useMutation({
		onSuccess: () => {
			utils.library.list.invalidate();
		},
	});

	const fetchGames = () => {
		utils.library.list.invalidate();
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
