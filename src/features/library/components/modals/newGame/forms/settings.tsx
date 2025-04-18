import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { useLanguageContext } from "@/contexts/I18N";
import { useFormActions } from "@/features/library/hooks/useFormActions";
import { FolderOpen } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import GameFormInput from "../../../gameFormInput";
import { NewGameFormSchema } from "../schema";

interface NewGameMetadataFormProps {
  form: UseFormReturn<NewGameFormSchema>;
}

const NewGameSettingsForm = ({ form }: NewGameMetadataFormProps) => {
  const { t } = useLanguageContext();
  const { handleWinePrefixButton } = useFormActions(form);

  return (
    <div className="flex flex-col w-full h-full gap-4">
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
                <FolderOpen className="w-5 h-5" />
              </Button>
            }
          />
        )}
      />
    </div>
  );
};

export default NewGameSettingsForm;
