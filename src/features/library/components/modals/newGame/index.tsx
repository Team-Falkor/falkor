import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
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

  const [popoverOpen, setPopoverOpen] = useState(false);
  const { t } = useLanguageContext();
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
    },
  });

  async function onSubmit(values: NewGameFormSchema) {
    const {
      gameName,
      gamePath,
      gameId,
      igdbId,
      gameIcon,
      gameArgs,
      gameCommand,
      steamId,
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
      });

      form.reset();
    } catch (err) {
      console.error("Failed to add game:", err);
    }
  }

  return (
    <DialogContent className="min-w-52 min-h-[30rem]">
      <Tabs defaultValue="metadata" className="w-full">
        <DialogHeader className="space-y-4">
          <DialogTitle>{t("new_game")}</DialogTitle>

          <TabsList className="w-full">
            <TabsTrigger value="metadata" className="flex-1">
              Metadata
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
          </TabsList>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col justify-between mt-3"
            autoComplete={"off"}
          >
            <TabsContent value="metadata">
              <NewGameMetadataForm form={form} />
            </TabsContent>
            <TabsContent value="settings">
              <NewGameSettingsForm form={form} />
            </TabsContent>
          </form>
        </Form>
      </Tabs>
      <div className="flex items-end justify-between flex-1 mt-4">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger>
            <Button variant={"secondary"}>Import from igdb</Button>
          </PopoverTrigger>
          <NewGameImport form={form} setPopoverOpen={setPopoverOpen} />
        </Popover>
        <Button
          type="submit"
          variant="secondary"
          onClick={form.handleSubmit(onSubmit)}
        >
          {t("add_game")}
        </Button>
      </div>
    </DialogContent>
  );
};

export default NewGameModal;
