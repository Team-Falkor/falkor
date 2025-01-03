import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguageContext } from "@/contexts/I18N";
import { useSettings } from "@/hooks";
import { useMemo } from "react";

const LanguageDropdown = () => {
  const { languages, i18n } = useLanguageContext();
  const { settings, updateSetting } = useSettings();

  const currentLanguage = useMemo(() => {
    return Object.entries(languages).find(([key, _value]) => {
      if (settings.language) return key === settings.language;
      return key === i18n.language;
    });
  }, [languages, settings.language, i18n.language]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full">{currentLanguage?.[1].nativeName}</Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Choose Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(languages).map(([key, value]) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={currentLanguage?.[0] === key}
            onCheckedChange={() => {
              i18n.changeLanguage(key);
              updateSetting("language", key);
            }}
          >
            {value.nativeName} ({key})
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageDropdown;
