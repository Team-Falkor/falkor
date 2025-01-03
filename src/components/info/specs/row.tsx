import { Data } from "@/components/info/specs";
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
    <div className="flex flex-col flex-shrink-0 w-full gap-2 p-4 overflow-hidden rounded-2xl bg-background">
      <h3 className="p-4 pt-1 pb-2 text-lg font-bold leading-6 capitalize">
        {t(type?.toLowerCase())}
      </h3>

      {Object.entries(specs).map(([key, value]) => (
        <div className="flex flex-col justify-between gap-1 p-4 py-1" key={key}>
          <span className="text-xs font-medium text-slate-400">{key}</span>
          <span className="mr-1 text-sm">{value[0]}</span>
        </div>
      ))}
    </div>
  );
};

export default RequirementsRow;
