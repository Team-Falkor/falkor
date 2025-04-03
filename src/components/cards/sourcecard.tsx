import { DownloadgameData, PluginSearchResponse } from "@/@types";
import { useLanguageContext } from "@/contexts/I18N";
import UseDownloads from "@/features/downloads/hooks/useDownloads";
import { useSettings } from "@/hooks";
import { createSlug, invoke, openLink } from "@/lib";
import { Deal } from "@/lib/api/itad/types";
import { useAccountServices } from "@/stores/account-services";
import { CloudDownload, ShoppingCart } from "lucide-react";
import { useCallback } from "react";
import { sanitizeFilename } from "../../lib/utils";
import { H3 } from "../typography/h3";
import { P } from "../typography/p";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type SourceCardProps = {
  source: PluginSearchResponse | Deal;
  pluginId?: string;
  game_data?: DownloadgameData;
  multiple_choice?: boolean;
  slug?: string;
};

export const SourceCard = ({ source, ...props }: SourceCardProps) => {
  const { t } = useLanguageContext();
  const { addDownload } = UseDownloads();
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
              type: "download",
              data: {
                id: props.slug ?? createSlug(props.game_data.name),
                url,
                game_data: props.game_data,
                file_name: props.game_data.name,
              },
            });
          }
        } else if (torBox) {
          url =
            type === "ddl"
              ? await torBox.downloadFromFileHost(url, password)
              : await torBox.downloadTorrentFromMagnet(url);
          if (props.game_data) {
            addDownload({
              type: "download",
              data: {
                id: props.slug ?? createSlug(props.game_data.name),
                url,
                game_data: props.game_data,
                file_name: await torBox.getDownloadName(returned_url, type),
                file_path: `${settings.downloadsPath}/${sanitizeFilename(props.game_data.name)}`,
                file_extension: "zip",
              },
            });
          }
        }
        return;
      }

      if (type === "ddl" && props.game_data) {
        addDownload({
          type: "download",
          data: {
            id: props.slug ?? createSlug(props.game_data.name),
            url,
            game_data: props.game_data,
            file_name: props.game_data.name,
          },
        });
        return;
      }

      if (props.game_data) {
        addDownload({
          type: "torrent",
          data: {
            torrentId: url,
            game_data: props.game_data,
          },
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
