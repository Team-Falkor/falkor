import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import NewGameMetadataForm from "@/features/library/components/modals/new-game/forms/metadata";
import NewGameSettingsForm from "@/features/library/components/modals/new-game/forms/settings";
import {
	type NewGameFormSchema,
	newGameFormSchema,
} from "@/features/library/components/modals/new-game/schema";
import { useLanguageContext } from "@/i18n/I18N";

interface UpdateGameFormProps {
	onSubmit: (values: NewGameFormSchema) => void;
	defaultValues: Partial<NewGameFormSchema>;
}

const UpdateGameForm = ({ onSubmit, defaultValues }: UpdateGameFormProps) => {
	const { t } = useLanguageContext();
	const form = useForm<NewGameFormSchema>({
		resolver: zodResolver(newGameFormSchema),
		defaultValues: defaultValues,
	});

	useEffect(() => {
		form.reset(defaultValues);
	}, [defaultValues, form.reset]);

	return (
		<Form {...form}>
			<form
				className="flex flex-col gap-4 overflow-y-auto"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<NewGameMetadataForm form={form} />
				<NewGameSettingsForm form={form} />
				<Button type="submit" className="mt-4 self-end">
					{t("save")}
				</Button>
			</form>
		</Form>
	);
};

export default UpdateGameForm;
