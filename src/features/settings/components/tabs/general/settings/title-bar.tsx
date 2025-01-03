import { SettingsTitleBarStyle } from "@/@types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/hooks";

const TitleBarDropdown = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full capitalize">{settings?.titleBarStyle}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Title Bar Style</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={settings?.titleBarStyle}
          onValueChange={(value) =>
            updateSetting("titleBarStyle", value as SettingsTitleBarStyle)
          }
        >
          <DropdownMenuRadioItem value="native">Native</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="icons">Icons</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="traffic-lights">
            Traffic Lights
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TitleBarDropdown;
