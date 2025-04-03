import { Data } from "@/components/info/specs";
import { H4 } from "@/components/typography/h4";
import { TypographyMuted } from "@/components/typography/muted";
import { TypographySmall } from "@/components/typography/small";
import { useLanguageContext } from "@/contexts/I18N";
import { scrapeOptions } from "@/lib";
import { useMemo } from "react";

type RequirementsRowProps = Data;

const RequirementsRow = ({ type, data }: RequirementsRowProps) => {
  const { t } = useLanguageContext();
  const specs = useMemo(() => !!data && scrapeOptions(data), [data]);

  const isSpecsEm = useMemo(() => Object.values(specs).length, [specs]);

  if (!data) return null;
  if (!isSpecsEm) return null;

  return (
    <div className="flex flex-col shrink-0 w-full gap-2 p-4 overflow-hidden rounded-2xl bg-background">
      <H4 className="p-4 pt-1 pb-2 capitalize">{t(type?.toLowerCase())}</H4>

      {Object.entries(specs).map(([key, value]) => (
        <div className="flex flex-col justify-between gap-1 p-4 py-1" key={key}>
          <TypographyMuted>{key}</TypographyMuted>
          <TypographySmall className="mr-1">{value[0]}</TypographySmall>
        </div>
      ))}
    </div>
  );
};

export default RequirementsRow;
