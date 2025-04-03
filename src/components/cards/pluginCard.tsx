import { PluginSetupJSONAuthor } from "@/@types";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/I18N";
import { usePluginActions } from "@/hooks";
import { cn, openLink } from "@/lib";
import { Download, Trash2 } from "lucide-react";
import { TypographyMuted } from "../typography/muted";
import { TypographySmall } from "../typography/small";

interface Props {
  image: string;
  banner?: string;
  description: string;
  name: string;
  id: string;
  version: string;
  author?: PluginSetupJSONAuthor;

  installed?: boolean;
  disabled: boolean;
  needsUpdate: boolean;
}

const PluginCard = ({
  image,
  name,
  id,
  version,
  description,
  banner,
  installed = false,
  author,
  disabled,
  needsUpdate,
}: Props) => {
  const { disablePlugin, enablePlugin, uninstallPlugin, updatePlugin } =
    usePluginActions(id);
  const { t } = useLanguageContext();

  return (
    <div className="relative grid items-center gap-4 px-4 py-2 rounded-lg">
      {!!banner && (
        <div className="absolute top-0 bottom-0 left-0 right-0 transition-all rounded-lg -z-0">
          <img
            src={banner}
            alt={name}
            className="rounded object-cover w-full h-full relative z-1"
          />

          <div className="absolute top-0 left-0 right-0 bottom-0 rounded-lg bg-linear-to-tl from-card to-transparent z-2" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-start gap-4">
        <div className="relative flex self-start gap-4">
          <img
            src={image}
            alt={name}
            className="rounded-xl drop-shadow-lg object-contain size-[50px]"
          />

          <div className="flex flex-col items-start justify-end">
            <TypographyMuted className="flex items-center gap-1 font-medium">
              {needsUpdate && (
                <TypographySmall className="font-bold text-red-500">
                  [Update available]
                </TypographySmall>
              )}
              {id} - V{version}{" "}
            </TypographyMuted>

            <TypographySmall className="truncate">{name}</TypographySmall>

            {!!author && (
              <TypographyMuted
                className={cn({
                  "cursor-pointer hover:underline": author.url,
                })}
                onClick={() => {
                  if (author.url) openLink(author.url);
                }}
              >
                {author.name}
              </TypographyMuted>
            )}
          </div>
        </div>

        <TypographyMuted className="text-xs font-medium text-left">
          {description}
        </TypographyMuted>
      </div>

      <div className="relative z-10 flex items-center justify-end gap-3">
        {needsUpdate && (
          <Button onClick={updatePlugin} size={"icon"}>
            <Download />
          </Button>
        )}

        {installed ? (
          <Button variant="destructive" onClick={uninstallPlugin} size={"icon"}>
            <Trash2 size={"20"} />
          </Button>
        ) : (
          <Button>{t("install")}</Button>
        )}

        {disabled ? (
          <Button onClick={enablePlugin}>{t("enable")}</Button>
        ) : (
          <Button variant={"destructive"} onClick={disablePlugin}>
            {t("disable")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PluginCard;
