import { H3 } from "@/components/typography/h3";
import { TypographyMuted } from "@/components/typography/muted";
import { useLanguageContext } from "@/contexts/I18N";
import { cn } from "@/lib";
import { HTMLAttributes, PropsWithChildren } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const SettingsSection = ({
  children,
  title,
  description,
  className,
  ...props
}: PropsWithChildren<Props>) => {
  const { t } = useLanguageContext();

  return (
    <div
      className={cn(
        "p-4 space-y-4 shadow-md rounded-xl bg-muted/60",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className={cn("flex flex-col mb-4")}>
          {title && <H3>{t("settings.settings." + title)}</H3>}
          {description && (
            <TypographyMuted>
              {t("settings.settings." + description)}
            </TypographyMuted>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
