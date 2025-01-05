import { P } from "@/components/typography/p";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { useLanguageContext } from "@/contexts/I18N";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useGames } from "../hooks/useGames";
import GameFormInput from "./gameFormInput";

const formSchema = z.object({
  gameName: z.string().min(1, { message: "Required" }),
  gamePath: z.string().min(1, { message: "Required" }),
  gameIcon: z.string().min(1, { message: "Required" }),
  gameArgs: z.string().optional(),
  gameCommand: z
    .string()
    .optional()
    .refine((s) => !s?.includes(" "), "No Spaces!"),
  igdbId: z.string().optional(),
  steamId: z.string().optional(),
  winePrefixFolder: z.string().optional(),
});

interface UpdateGameFormProps {
  defaultValues: z.infer<typeof formSchema>;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void> | void;
}

const UpdateGameForm = ({ defaultValues, onSubmit }: UpdateGameFormProps) => {
  const { t } = useLanguageContext();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameArgs: defaultValues.gameArgs ?? "",
      gameCommand: defaultValues.gameCommand ?? "",
      gameIcon: defaultValues.gameIcon ?? "",
      gameName: defaultValues.gameName ?? "",
      gamePath: defaultValues.gamePath ?? "",
      igdbId: defaultValues.igdbId ?? "",
      steamId: defaultValues.steamId ?? "",
      winePrefixFolder: defaultValues.winePrefixFolder ?? "",
    },
  });

  const { loading, error } = useGames();

  const handlePathButton = async () => {
    const selected: any = await window.ipcRenderer.invoke(
      "generic:open-dialog",
      {
        properties: ["openFile"],
        filters: [{ name: "Executable", extensions: ["exe", "sh"] }],
      }
    );

    if (selected.canceled) return;
    if (!selected.filePaths.length) return;

    const selectedPath = selected.filePaths[0];
    form.setValue("gamePath", selectedPath.replace(/\\/g, "//"));
  };

  const handleIconButton = async () => {
    const selected: any = await window.ipcRenderer.invoke(
      "generic:open-dialog",
      {
        properties: ["openFile"],
        filters: [
          { name: "Images", extensions: ["jpg", "png", "jpeg", "webp"] },
        ],
      }
    );

    if (selected.canceled) return;
    if (!selected.filePaths.length) return;

    const selectedPath = selected.filePaths[0];
    form.setValue("gameIcon", selectedPath.replace(/\\/g, "//"));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        autoComplete="off"
      >
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
              Button={
                <Button size="icon" onClick={handlePathButton}>
                  <FolderOpen />
                </Button>
              }
              required
              field={field}
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
              required
              Button={
                <Button size="icon" onClick={handleIconButton}>
                  <FolderOpen />
                </Button>
              }
              field={field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="gameArgs"
          render={({ field }) => (
            <>
              <GameFormInput
                text={t("arguments")}
                description={t("the_arguments_to_pass_to_the_game")}
                field={field}
              />
              {form.formState.errors.gameArgs && (
                <P className="w-full text-right text-red-500">
                  {form.formState.errors.gameArgs.message}
                </P>
              )}
            </>
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

        <FormField
          control={form.control}
          name="winePrefixFolder"
          render={({ field }) => (
            <GameFormInput
              text={t("wine_prefix_folder")}
              description={t("the_path_to_your_wine_prefix_folder")}
              field={field}
            />
          )}
        />
      </form>

      <DialogFooter className="pt-2">
        <DialogClose>
          <Button variant="destructive">{t("cancel")}</Button>
        </DialogClose>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
          {loading ? `${t("updating")}...` : t("update_game")}
        </Button>
      </DialogFooter>
      {error && <P className="w-full text-right text-red-500">{error}</P>}
    </Form>
  );
};

export default UpdateGameForm;
