import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { useLanguageContext } from "@/contexts/I18N";
import { useFormActions } from "@/features/library/hooks/useFormActions";
import { FolderOpen, Shuffle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import GameFormInput from "../../../gameFormInput";
import { NewGameFormSchema } from "../schema";

interface NewGameMetadataFormProps {
  form: UseFormReturn<NewGameFormSchema>;
}

const NewGameMetadataForm = ({ form }: NewGameMetadataFormProps) => {
  const { t } = useLanguageContext();
  const { handleIconButton, handlePathButton, handleShuffleButton } =
    useFormActions(form);

  return (
    <div className="w-full min-h-[20rem] h-full overflow-y-auto">
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
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  handlePathButton();
                }}
              >
                <FolderOpen className="w-5 h-5" />
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
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  handleShuffleButton();
                }}
              >
                <Shuffle className="w-5 h-5" />
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
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  handleIconButton();
                }}
              >
                <FolderOpen className="w-5 h-5" />
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
