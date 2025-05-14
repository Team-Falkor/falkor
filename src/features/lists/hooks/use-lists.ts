import { trpc } from "@/lib";

export function useLists() {
	const utils = trpc.useUtils();

	const {
		data: lists,
		isPending: isLoading,
		error,
	} = trpc.lists.getAll.useQuery();

	const { mutate: deleteList } = trpc.lists.delete.useMutation({
		onSuccess: () => {
			utils.lists.invalidate();
		},
	});

	const { mutate: createList, isPending: isCreating } =
		trpc.lists.create.useMutation({
			onSuccess: () => {
				utils.lists.invalidate();
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
