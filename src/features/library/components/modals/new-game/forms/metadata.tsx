import { FolderOpen, Shuffle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { useFormActions } from "@/features/library/hooks/use-form-actions";
import { useLanguageContext } from "@/i18n/I18N";
import GameFormInput from "../../../game-form-input";
import type { NewGameFormSchema } from "../schema";

interface NewGameMetadataFormProps {
	form: UseFormReturn<NewGameFormSchema>;
}

const NewGameMetadataForm = ({ form }: NewGameMetadataFormProps) => {
	const { t } = useLanguageContext();
	const { handleIconButton, handlePathButton, handleShuffleButton } =
		useFormActions(form);

	return (
		<div className="flex h-full w-full flex-col gap-4">
			<FormField
				control={form.control}
				name="gameName"
				render={({ field }) => (
					<GameFormInput
						text={t("name")}
						description={t("the_name_of_the_game")}
						field={field}
						required
					/>
				)}
			/>

			<FormField
				control={form.control}
				name="gamePath"
				render={({ field }) => (
					<GameFormInput
						text={t("path")}
						description={t("the_path_to_the_game")}
						field={field}
						required
						Button={
							<Button
								size="icon"
								className="rounded-lg rounded-l-none"
								onClick={(e) => {
									e.preventDefault();
									handlePathButton();
								}}
							>
								<FolderOpen className="h-5 w-5" />
							</Button>
						}
					/>
				)}
			/>

			<FormField
				control={form.control}
				name="gameId"
				render={({ field }) => (
					<GameFormInput
						text={t("id")}
						description={t("game_id")}
						field={field}
						required
						Button={
							<Button
								className="rounded-lg rounded-l-none"
								size="icon"
								onClick={(e) => {
									e.preventDefault();
									handleShuffleButton();
								}}
							>
								<Shuffle className="h-5 w-5" />
							</Button>
						}
					/>
				)}
			/>

			<FormField
				control={form.control}
				name="gameIcon"
				render={({ field }) => (
					<GameFormInput
						text={t("icon")}
						description={t("the_path_or_url_of_the_icon")}
						field={field}
						required
						Button={
							<Button
								className="rounded-lg rounded-l-none"
								size="icon"
								onClick={(e) => {
									e.preventDefault();
									handleIconButton();
								}}
							>
								<FolderOpen className="h-5 w-5" />
							</Button>
						}
					/>
				)}
			/>

			<FormField
				control={form.control}
				name="igdbId"
				render={({ field }) => (
					<GameFormInput
						text={t("igdb_id")}
						description={t("igdb_id")}
						field={field}
					/>
				)}
			/>

			<FormField
				control={form.control}
				name="steamId"
				render={({ field }) => (
					<GameFormInput
						text={t("steam_id")}
						description={t("steam_id")}
						field={field}
					/>
				)}
			/>
		</div>
	);
};

export default NewGameMetadataForm;
