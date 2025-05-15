import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
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

				<FormField
					control={form.control}
					name="installed"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>{t("installed")}</FormLabel>
								<FormDescription>{t("installed_description")}</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<Button type="submit" className="mt-4 self-end">
					{t("save")}
				</Button>
			</form>
		</Form>
	);
};

export default UpdateGameForm;
