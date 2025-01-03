import { SettingsConfig } from "@/@types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/contexts/I18N";
import { useDebounce, useSettings } from "@/hooks";
import { invoke } from "@/lib";
import { Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "../section";
import SettingTitle from "../title";
import SettingsContainer from "./container";

const TorrentSettings = () => {
  const { t } = useLanguageContext();
  const { settings, updateSetting } = useSettings();
  const [downloadPath, setDownloadPath] = useState(
    settings?.downloadsPath ?? ""
  );
  const [maxDownloadSpeed, setMaxDownloadSpeed] = useState(
    settings?.maxDownloadSpeed ?? 0
  );
  const [maxUploadSpeed, setMaxUploadSpeed] = useState(
    settings?.maxUploadSpeed ?? 0
  );

  const debouncedUpdateSetting = useDebounce(
    (key: keyof SettingsConfig, value: any, cb?: () => void) => {
      updateSetting(key, value);
      toast.success(`Successfully updated ${key} to ${value}`);
      cb?.();
    },
    1000
  );

  useEffect(() => {
    if (settings.downloadsPath) {
      setDownloadPath(settings.downloadsPath);
    }
  }, [settings.downloadsPath]);

  const handleSpeedChange = (
    key: keyof Pick<SettingsConfig, "maxDownloadSpeed" | "maxUploadSpeed">,
    value: string
  ) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      key === "maxDownloadSpeed"
        ? setMaxDownloadSpeed(parsedValue)
        : setMaxUploadSpeed(parsedValue);
      debouncedUpdateSetting(key, parsedValue, () => {
        if (key === "maxDownloadSpeed") {
          invoke("torrent:throttle-download", parsedValue);
        }
        if (key === "maxUploadSpeed") {
          invoke("torrent:throttle-upload", parsedValue);
        }
      });
    }
  };

  const openDialog = async () => {
    const selected: { canceled: boolean; filePaths: string[] } =
      await window.ipcRenderer.invoke("generic:open-dialog", {
        properties: ["openDirectory"],
      });

    if (!selected.canceled && selected.filePaths.length > 0) {
      setDownloadPath(selected.filePaths[0]);
    }
  };

  const handleSave = () => {
    if (!downloadPath.trim()) return;
    updateSetting("downloadsPath", downloadPath);
  };

  return (
    <div>
      <SettingTitle>{t("settings.titles.download")}</SettingTitle>

      <SettingsContainer>
        <SettingsSection title="downloads_path">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between">
              <Input
                placeholder={t("settings.settings.downloads_path")}
                type="text"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                aria-label="Downloads Path"
                className="rounded-lg rounded-r-none"
              />

              <Button
                size="icon"
                className="rounded-lg rounded-l-none bg-muted hover:bg-muted"
                onClick={openDialog}
                aria-label="Select Folder"
              >
                <Folder />
              </Button>
            </div>

            <Button
              variant="success"
              onClick={handleSave}
              disabled={!downloadPath.trim()}
            >
              Save
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection title="max_speed" description="max_speed_description">
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxDownloadSpeed">{t("max_download_speed")}</Label>

            <Input
              id="maxDownloadSpeed"
              placeholder={t("max_download_speed")}
              type="number"
              min={-1}
              value={maxDownloadSpeed}
              onChange={(e) =>
                handleSpeedChange("maxDownloadSpeed", e.target.value)
              }
              aria-label="Max Download Speed"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxUploadSpeed">{t("max_upload_speed")}</Label>

            <Input
              id="maxUploadSpeed"
              placeholder={t("max_upload_speed")}
              type="number"
              min={-1}
              value={maxUploadSpeed}
              onChange={(e) =>
                handleSpeedChange("maxUploadSpeed", e.target.value)
              }
              aria-label="Max Upload Speed"
            />
          </div>
        </SettingsSection>
      </SettingsContainer>
    </div>
  );
};

export default TorrentSettings;
