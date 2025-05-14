import { FolderOpen } from "lucide-react";
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

const NewGameSettingsForm = ({ form }: NewGameMetadataFormProps) => {
	const { t } = useLanguageContext();
	const { handleWinePrefixButton } = useFormActions(form);

	return (
		<div className="flex h-full w-full flex-col gap-4">
			<FormField
				control={form.control}
				name="gameArgs"
				render={({ field }) => (
					<GameFormInput
						text={t("arguments")}
						description={t("the_arguments_to_pass_to_the_game")}
						field={field}
					/>
				)}
			/>

			<FormField
				control={form.control}
				name="gameCommand"
				render={({ field }) => (
					<GameFormInput
						text={t("command")}
						description={t("the_command_to_run_the_game_e_g_wine")}
						field={field}
					/>
				)}
			/>

			<FormField
				control={form.control}
				name="winePrefixFolder"
				render={({ field }) => (
					<GameFormInput
						text={t("wine_prefix_folder")}
						description={t("the_path_to_your_wine_prefix_folder")}
						field={field}
						Button={
							<Button
								className="rounded-lg rounded-l-none"
								size="icon"
								onClick={(e) => {
									e.preventDefault();
									handleWinePrefixButton();
								}}
							>
								<FolderOpen className="h-5 w-5" />
							</Button>
						}
					/>
				)}
			/>
		</div>
	);
};

export default NewGameSettingsForm;
