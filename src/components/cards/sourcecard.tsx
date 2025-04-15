import { DownloadgameData } from "@/@types";
import { useLanguageContext } from "@/contexts/I18N";
import { useDownloadActions } from "@/features/downloads/hooks";
import { useSettings } from "@/hooks";
import { invoke, openLink } from "@/lib";
import { Deal } from "@/lib/api/itad/types";
import { useAccountServices } from "@/stores/account-services";
import { PluginSearchResponse } from "@team-falkor/shared-types";
import { CloudDownload, ShoppingCart } from "lucide-react";
import { useCallback } from "react";
import { sanitizeFilename } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { H3, P } from "../ui/typography";

type SourceCardProps = {
  source: PluginSearchResponse | Deal;
  pluginId?: string;
  game_data?: DownloadgameData;
  multiple_choice?: boolean;
  slug?: string;
};

export const SourceCard = ({ source, ...props }: SourceCardProps) => {
  const { t } = useLanguageContext();
  const { addDownload } = useDownloadActions();
  const { realDebrid, torBox } = useAccountServices();
  const { settings } = useSettings();

  const isDeal = (item: SourceCardProps["source"]): item is Deal =>
    "price" in item && "shop" in item;

  const handleClick = useCallback(async () => {
    if (isDeal(source)) {
      openLink(source.url);
      return;
    }

    if (!props.pluginId) return;

    const { multiple_choice: multipleChoice, pluginId } = props;
    const { return: returned_url, password, type } = source;

    let url = returned_url;

    try {
      if (multipleChoice) {
        const data = await invoke<string[], string>(
          "plugins:use:get-multiple-choice-download",
          pluginId,
          returned_url
        );
        if (!data?.length) return;
        url = data[0];
      }

      if (settings.useAccountsForDownloads && (realDebrid || torBox)) {
        if (realDebrid) {
          url =
            type === "ddl"
              ? await realDebrid.downloadFromFileHost(url, password)
              : await realDebrid.downloadTorrentFromMagnet(url, password);

          if (props.game_data) {
            addDownload({
              type: "http",
              url,
              name: props.game_data.name,
              path: settings.downloadsPath,
            });
          }
        } else if (torBox) {
          url =
            type === "ddl"
              ? await torBox.downloadFromFileHost(url, password)
              : await torBox.downloadTorrentFromMagnet(url);
          if (props.game_data) {
            const fileName = await torBox.getDownloadName(returned_url, type);
            addDownload({
              type: "http",
              url,
              name: fileName,
              path: `${settings.downloadsPath}/${sanitizeFilename(props.game_data.name)}`,
            });
          }
        }
        return;
      }

      if (type === "ddl" && props.game_data) {
        addDownload({
          type: "http",
          url,
          name: props.game_data.name,
          path: settings.downloadsPath,
        });
        return;
      }

      if (props.game_data) {
        addDownload({
          type: "torrent",
          url,
          name: props.game_data.name,
          path: settings.downloadsPath,
        });
      }
    } catch (error) {
      console.error("Error handling download:", error);
    }
  }, [addDownload, realDebrid, torBox, settings, source, props]);

  return (
    <Card className="w-full h-28 p-2.5 overflow-hidden border-none rounded-2xl">
      <div className="flex flex-col items-start justify-between w-full h-full overflow-hidden">
        {isDeal(source) ? (
          <>
            <H3>{source.shop.name}</H3>
            <P className="w-full -mt-0.5 truncate text-muted-foreground">
              {source.url}
            </P>
            <Button
              className="items-center w-full gap-3 font-bold rounded-full"
              variant="success"
              onClick={handleClick}
            >
              <ShoppingCart size={18} fill="currentColor" />
              {source.price.currency} {source.price.amount}
            </Button>
          </>
        ) : (
          <>
            <P className="w-full line-clamp-2">{source.name}</P>
            <Button
              className="items-center w-full gap-3 font-bold capitalize rounded-full"
              variant="success"
              onClick={handleClick}
            >
              <CloudDownload
                size={18}
                fill="currentColor"
                className="shrink-0"
              />
              <P className="max-w-full capitalize truncate">
                {source?.uploader ?? t("download")}
              </P>
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
