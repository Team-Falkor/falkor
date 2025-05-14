import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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

export const NewGameModal = () => {
	const [open, setOpen] = useState(false);
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
			await createGame({
				gameName,
				gamePath,
				gameId,
				gameIcon,
				gameArgs,
				gameCommand,
				igdbId: igdbId ? Number(igdbId) : undefined,
				gameSteamId: steamId,
				winePrefixFolder: winePrefixFolder,
			});
			form.reset();
		} catch (err) {
			console.error("Failed to add game:", err);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<NewGameButton onClick={() => setOpen(true)} />
			</DialogTrigger>

			<Tabs defaultValue="metadata">
				<DialogContent className="flex h-[calc(100vh-10rem)] flex-col">
					<DialogHeader>
						<DialogTitle>{t("new_game")}</DialogTitle>
						<DialogDescription>create a new game</DialogDescription>

						<TabsList className="flex w-full justify-between">
							<TabsTrigger value="metadata" className="flex-1">
								{t("sections.metadata")}
							</TabsTrigger>
							<TabsTrigger value="settings" className="flex-1">
								{t("sections.settings")}
							</TabsTrigger>
						</TabsList>
					</DialogHeader>

					<Form {...form}>
						<div className="flex-1 overflow-hidden">
							<ScrollArea className="h-full">
								<form
									className="flex flex-col gap-4"
									autoComplete="off"
									onSubmit={form.handleSubmit(handleAddGame)}
								>
									<TabsContent value="metadata">
										<NewGameMetadataForm form={form} />
									</TabsContent>

									<TabsContent value="settings">
										<NewGameSettingsForm form={form} />
									</TabsContent>
								</form>
							</ScrollArea>
						</div>
					</Form>
				</DialogContent>
			</Tabs>
		</Dialog>
	);
};
