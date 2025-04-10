import { PluginSetupJSONAuthor } from "@/@types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguageContext } from "@/contexts/I18N";
import { usePluginActions } from "@/hooks";
import { cn, invoke, openLink } from "@/lib";
import { Download, Power, PowerOff, Trash2, UserIcon } from "lucide-react";
import { SyntheticEvent, useMemo, useState } from "react";
import { toast } from "sonner";

interface UnifiedPluginCardProps {
  // Common props
  id: string;
  name: string;
  description: string;
  version: string;
  image: string;
  banner?: string;
  author?: PluginSetupJSONAuthor;

  // Plugin specific props
  isInstalled?: boolean;
  disabled?: boolean;
  needsUpdate?: boolean;

  // Provider specific props
  setupUrl?: string;
}

const UnifiedPluginCard = ({
  id,
  name,
  description,
  version,
  image,
  author,
  isInstalled = false,
  disabled = false,
  needsUpdate = false,
  setupUrl,
}: UnifiedPluginCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { disablePlugin, enablePlugin, uninstallPlugin, updatePlugin } =
    usePluginActions(id);
  const { t } = useLanguageContext();

  // get 4 letters from name after space or use the min number of words if below 4
  const words = useMemo(() => name.split(" "), [name]);
  const logo = useMemo(
    () => (words.length > 4 ? words[0][0] + words[1][0] : words[0]),
    [words]
  );

  const handleInstall = async () => {
    if (!setupUrl) return;

    const installed = await invoke<
      { message: string; success: boolean },
      string
    >("plugins:install", setupUrl);

    if (!installed?.success) {
      toast.error(installed?.message);
      return;
    }

    toast.success("Plugin installed");
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handlePlaceholder = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    e.currentTarget.src = `https://placehold.co/96x96?text=${encodeURIComponent(logo)}`;
  };

  return (
    <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.01] relative overflow-hidden">
      <CardHeader className="justify-center items-center text-center space-y-4">
        <div className="w-full flex justify-center">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted/20">
            <img
              src={
                imageError
                  ? `https://placehold.co/96x96?text=${encodeURIComponent(logo)}`
                  : image
              }
              alt={name}
              className={cn(
                "w-full h-full object-cover transition-all duration-200",
                {
                  "opacity-0": !imageLoaded && !imageError,
                  "group-hover:scale-110": imageLoaded && !imageError,
                }
              )}
              onError={handlePlaceholder}
              onLoad={handleImageLoad}
              loading="lazy"
            />
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-xl font-semibold transition-colors duration-200 group-hover:text-primary">
            {name}
          </CardTitle>
          <CardDescription className="text-sm flex items-center justify-center gap-2">
            {needsUpdate && (
              <span className="font-bold text-red-500">[Update available]</span>
            )}
            {id} - V{version}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-3 text-pretty text-center w-full text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>

      <CardFooter className="w-full mt-auto">
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {author && (
              <a
                onClick={() => {
                  if (author.url) openLink(author.url);
                }}
                className={cn(
                  "flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-200 group/author",
                  { "cursor-pointer": author.url }
                )}
              >
                <UserIcon className="size-4 flex-shrink-0" />
                <span className="truncate text-sm group-hover/author:underline">
                  {author.name}
                </span>
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isInstalled ? (
              <>
                {needsUpdate && (
                  <Button
                    onClick={updatePlugin}
                    size="sm"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <Download className="mr-2" />
                    {t("update")}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={uninstallPlugin}
                  size="sm"
                  className="transition-all duration-200 hover:scale-105 capitalize"
                >
                  <Trash2 />
                  {t("uninstall")}
                </Button>
                {disabled ? (
                  <Button
                    variant="success"
                    onClick={enablePlugin}
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 capitalize"
                  >
                    <Power />
                    {t("enable")}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={disablePlugin}
                    size="sm"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <PowerOff />
                    {t("disable")}
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={handleInstall}
                size="sm"
                className="transition-all duration-200 hover:scale-105"
              >
                <Download />
                {t("install")}
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UnifiedPluginCard;
