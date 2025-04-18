import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/contexts/I18N";
import { PropsWithChildren } from "react";

type Props = {
  title: string;
};

export const SettingsItem = ({ title, children }: PropsWithChildren<Props>) => {
  const { t } = useLanguageContext();

  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={title}>{t(`settings.settings.${title}`)}</Label>

      {children}
    </div>
  );
};
