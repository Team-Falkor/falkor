import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguageContext } from "@/contexts/I18N";
import { useGames } from "@/features/library/hooks/useGames";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import NewGameMetadataForm from "./forms/metadata";
import NewGameSettingsForm from "./forms/settings";
import NewGameImport from "./import";
import { NewGameFormSchema, newGameFormSchema } from "./schema";

const NewGameModal = () => {
  const { addGame } = useGames();
  const { t } = useLanguageContext();
  const [popoverOpen, setPopoverOpen] = useState(false);

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
      await addGame({
        game_name: gameName,
        game_path: gamePath,
        game_id: gameId,
        game_icon: gameIcon,
        game_args: gameArgs,
        game_command: gameCommand,
        igdb_id: igdbId ? Number(igdbId) : null,
        game_steam_id: steamId,
        wine_prefix_folder: winePrefixFolder,
      });
      form.reset();
    } catch (err) {
      console.error("Failed to add game:", err);
    }
  };

  return (
    <Tabs defaultValue="metadata">
      <DialogContent className="h-[calc(100vh-10rem)] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("new_game")}</DialogTitle>

          <TabsList className="flex justify-between w-full">
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

        <div className="flex items-center justify-between gap-2">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button>{t("import_from_igdb")}</Button>
            </PopoverTrigger>
            <NewGameImport form={form} setPopoverOpen={setPopoverOpen} />
          </Popover>

          <Button type="submit" onClick={form.handleSubmit(handleAddGame)}>
            {t("add_game")}
          </Button>
        </div>
      </DialogContent>
    </Tabs>
  );
};

export default NewGameModal;
