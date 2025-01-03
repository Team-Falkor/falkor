import { useLanguageContext } from "@/contexts/I18N";
import { cn } from "@/lib";
import { PropsWithChildren } from "react";

interface Props {
  title?: string;
  description?: string;
}

export const SettingsSection = ({
  children,
  title,
  description,
}: PropsWithChildren<Props>) => {
  const { t } = useLanguageContext();

  return (
    <div className="p-4 space-y-4 bg-white shadow-md rounded-xl bg-card/40">
      {(title || description) && (
        <div className={cn("flex flex-col mb-4")}>
          {title && (
            <h2 className="text-xl font-semibold">
              <span>{t("settings.settings." + title)}</span>
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {t("settings.settings." + description)}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
