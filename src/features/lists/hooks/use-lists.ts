import { trpc } from "@/lib";

export function useLists() {
	const utils = trpc.useUtils();

	const {
		data: lists,
		isPending: isLoading,
		error,
	} = trpc.lists.getAll.useQuery(); // Fetches all lists

	const { mutate: deleteList } = trpc.lists.delete.useMutation({
		onSuccess: () => {
			// Invalidates all queries when a list is deleted
			utils.invalidate(undefined, { refetchType: "all", type: "all" });
		},
	});

	const { mutate: createList, isPending: isCreating } =
		trpc.lists.create.useMutation({
			onSuccess: () => {
				// Invalidates all queries when a list is created
				utils.invalidate(undefined, { refetchType: "all", type: "all" });
			},
		});

	return {
		lists,
		isLoading,
		error,
		deleteList,
		createList,
		isCreating,
	};
}
