import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguageContext } from "@/contexts/I18N";
import { useEffect, useState } from "react";
import LogWindow from "./logWindow";

const LogDisplay = () => {
  const { t } = useLanguageContext();

  const getInitialEnabledState = () => {
    const storedValue = localStorage.getItem("enableDevConsole");
    return storedValue ? JSON.parse(storedValue) : false;
  };

  const [enabled, setEnabled] = useState<boolean>(getInitialEnabledState);

  useEffect(() => {
    setEnabled(getInitialEnabledState());
  }, []);

  const onCheckedChange = (value: boolean) => {
    localStorage.setItem("enableDevConsole", JSON.stringify(value));
    setEnabled(value);
  };

  return (
    <div className="flex flex-col" id="developer-settings">
      <div className="flex items-center gap-2" id="enable-dev-console">
        <Switch
          id="enable-dev-console"
          onCheckedChange={onCheckedChange}
          checked={enabled}
        />
        <Label htmlFor="enable-dev-console">
          {t("settings.settings.enable_developer_console")}
        </Label>
      </div>
      <LogWindow enabled={enabled} />
    </div>
  );
};

export default LogDisplay;
