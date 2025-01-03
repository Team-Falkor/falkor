import { AppInfo } from "@/@types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useLanguageContext } from "@/contexts/I18N";
import { useUpdater } from "@/hooks/useUpdater";
import { invoke } from "@/lib";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";

// Helper function to get ordinal suffix
const getOrdinal = (day: number): string => {
  if (day > 3 && day < 21) return "th"; // Handle special cases for teens
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

// Format date with ordinal suffix
const formatWithOrdinal = (date: Date): string => {
  const day = parseInt(format(date, "d"), 10); // Extract day as a number
  const ordinal = getOrdinal(day);
  return `${day}${ordinal} ${format(date, "LLLL, yyyy")}`;
};

const Updater = () => {
  const { t } = useLanguageContext();
  const { updateAvailable, installUpdate, progress, updateInfo } = useUpdater();
  const [open, setOpen] = useState(false);

  const {
    data: appInfo,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["app", "info"],
    queryFn: async () => invoke<AppInfo>("generic:get-app-info"),
  });

  useEffect(() => {
    if (updateAvailable === true) setOpen(true);
    setOpen(false);
  }, [updateAvailable]);

  useEffect(() => {
    const handleError = (_: unknown, error: string) => {
      console.error("Error updating app:", error);
    };

    window.ipcRenderer.on("updater:error", handleError);

    return () => {
      window.ipcRenderer.removeAllListeners("updater:error");
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("update_available")}</DialogTitle>
          <DialogDescription>{t("update_description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          {appInfo && !isPending && !isError && appInfo.app_version && (
            <div className="flex flex-row items-end gap-2">
              <p className="text-sm text-muted-foreground min-w-28">
                {t("current_version")}:
              </p>
              <h2 className="text-lg font-bold capitalize">
                {appInfo.app_version}
              </h2>
            </div>
          )}

          {updateInfo?.version && (
            <div className="flex flex-row items-end gap-2">
              <p className="text-sm text-muted-foreground min-w-28">
                {t("new_version")}:
              </p>
              <h2 className="text-lg font-bold capitalize">
                {updateInfo.version}
              </h2>
            </div>
          )}

          {updateInfo?.releaseDate && (
            <div className="flex flex-row items-end gap-2">
              <p className="text-sm text-muted-foreground min-w-28">
                {t("release_date")}:
              </p>
              <h2 className="text-lg font-bold capitalize">
                {formatWithOrdinal(new Date(updateInfo.releaseDate))}
              </h2>
            </div>
          )}

          {progress !== undefined && progress > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={progress} />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant="destructive">{t("later")}</Button>
          </DialogClose>
          <Button
            onClick={installUpdate}
            disabled={progress !== undefined && progress > 0}
          >
            {t("update_now")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Updater;
