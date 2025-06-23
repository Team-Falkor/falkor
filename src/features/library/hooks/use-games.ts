import { toast } from "sonner";
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
			staleTime: 1000 * 60 * 5,
			refetchInterval: 1000 * 30,
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
		onSuccess: async (data) => {
			if (!data) {
				toast.error("error creating game");
				return;
			}

			await utils.library.list.invalidate(undefined, {
				refetchType: "all",
				type: "all",
			});

			toast.success("Game added successfully!");
		},
		onError: async (error) => {
			toast.error("Error adding game. Please try again.", {
				description: error.message,
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
