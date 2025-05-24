import { zodResolver } from "@hookform/resolvers/zod";
import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter, // Import DialogFooter
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGames } from "@/features/library/hooks/use-games";
import { useLanguageContext } from "@/i18n/I18N";
import { NewGameButton } from "../../new-game";
import NewGameMetadataForm from "./forms/metadata";
import NewGameSettingsForm from "./forms/settings";
import { type NewGameFormSchema, newGameFormSchema } from "./schema";

interface NewGameModalProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}

export const NewGameModal = ({ open, setOpen }: NewGameModalProps) => {
	const { t } = useLanguageContext();
	const { createGame } = useGames();

	const form = useForm<NewGameFormSchema>({
		resolver: zodResolver(newGameFormSchema),
		defaultValues: {
			gameArgs: "",
			gameCommand: "",
			gameIcon: "",
			gameId: "",
			gameName: "",
			gamePath: "",
			igdbId: "",
			steamId: "",
			winePrefixFolder: "",
		},
	});

	const handleAddGame = async (values: NewGameFormSchema) => {
		const {
			gameName,
			gamePath,
			gameId,
			igdbId,
			gameIcon,
			gameArgs,
			gameCommand,
			steamId,
			winePrefixFolder,
		} = values;

		try {
			createGame(
				{
					gameName,
					gamePath,
					gameId,
					gameIcon,
					gameArgs,
					gameCommand,
					igdbId: igdbId ? Number(igdbId) : undefined,
					gameSteamId: steamId,
					winePrefixFolder: winePrefixFolder,
				},
				{
					onSuccess: () => {
						form.reset();
					},
					onError: (err) => {
						console.error("Failed to add game:", err);
						toast.error("Failed to add game", {
							description: err.message,
						});
					},
				},
			);
			// setOpen(false); // Optionally close dialog on success
		} catch (err) {
			console.error("Failed to add game:", err);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<NewGameButton onClick={() => setOpen(true)} />
			</DialogTrigger>

			<DialogContent className="flex h-[calc(100vh-10rem)] flex-col">
				<DialogHeader>
					<DialogTitle>{t("new_game")}</DialogTitle>
					<DialogDescription>
						{t("new_game_modal.description")}
					</DialogDescription>
				</DialogHeader>

				<Tabs
					defaultValue="metadata"
					className="flex flex-1 flex-col overflow-hidden"
				>
					<TabsList className="flex w-full justify-between">
						<TabsTrigger value="metadata" className="flex-1">
							{t("sections.metadata")}
						</TabsTrigger>
						<TabsTrigger value="settings" className="flex-1">
							{t("sections.settings")}
						</TabsTrigger>
					</TabsList>

					<Form {...form}>
						<form
							className="flex flex-1 flex-col overflow-hidden"
							autoComplete="off"
							onSubmit={form.handleSubmit(handleAddGame)}
						>
							<div className="flex-1 overflow-y-auto">
								<ScrollArea className="h-full px-1 py-4">
									<TabsContent value="metadata" className="mt-0">
										<NewGameMetadataForm form={form} />
									</TabsContent>
									<TabsContent value="settings" className="mt-0">
										<NewGameSettingsForm form={form} />
									</TabsContent>
								</ScrollArea>
							</div>
							<DialogFooter className="mt-auto pt-4">
								<Button type="submit">{t("add_game")}</Button>
							</DialogFooter>
						</form>
					</Form>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
