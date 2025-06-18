import type { UseFormReturn } from "react-hook-form";
import { trpc } from "@/lib";
import type { NewGameFormSchema } from "../components/modals/new-game/schema";

export const useFormActions = (form: UseFormReturn<NewGameFormSchema>) => {
	const openDialog = trpc.app.openDialog.useMutation();

	const handlePathButton = async () => {
		const selected = await openDialog.mutateAsync({
			properties: ["openFile"],
			filters: [
				{
					name: "Executable",
					extensions: [
						"exe",
						"bat",
						"cmd",
						"sh",
						"run",
						"AppImage",
						"jar",
						"url",
					],
				},
			],
		});

		if (!selected.success) return;
		if (selected.canceled) return;
		if (!selected.filePaths.length) return;

		const selectedPath = selected.filePaths[0];
		form.setValue("gamePath", selectedPath.replace(/\\/g, "//"));
	};

	const handleWinePrefixButton = async () => {
		const selected = await openDialog.mutateAsync({
			properties: ["openDirectory"],
		});
		if (!selected.success) return;
		if (selected.canceled) return;
		if (!selected.filePaths.length) return;

		const selectedPath = selected.filePaths[0];
		form.setValue("winePrefixFolder", selectedPath.replace(/\\/g, "//"));
	};

	const handleIconButton = async () => {
		const selected = await openDialog.mutateAsync({
			properties: ["openFile"],
			filters: [{ name: "Images", extensions: ["jpg", "png", "jpeg", "webp"] }],
		});

		if (!selected.success) return;
		if (selected.canceled) return;
		if (!selected.filePaths.length) return;

		const selectedPath = selected.filePaths[0];
		form.setValue("gameIcon", selectedPath.replace(/\\/g, "//"));
	};

	const handleShuffleButton = () => {
		const currentGameId = form.getValues("gameId");

		if (currentGameId?.length || currentGameId?.trim() !== "") return;

		const gameName = form.getValues("gameName");

		if (!gameName?.length)
			form.setValue("gameId", Math.random().toString(36).substring(2, 15));
		else form.setValue("gameId", gameName.split(" ").join("-").toLowerCase());
	};

	return {
		handlePathButton,
		handleIconButton,
		handleShuffleButton,
		handleWinePrefixButton,
		openDialog,
	};
};
