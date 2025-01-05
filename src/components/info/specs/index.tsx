import RequirementsRow from "@/components/info/specs/row";
import { H5 } from "@/components/typography/h5";
import { useLanguageContext } from "@/contexts/I18N";
import { PcRequirements } from "@/lib/api/igdb/types";
import { useMemo } from "react";

type PcSpecsProps = PcRequirements;

export type Data = {
  type: "minimum" | "recommended";
  data: string | undefined | null;
};

const PcSpecs = ({ minimum, recommended }: PcSpecsProps) => {
  const { t } = useLanguageContext();

  const items = useMemo(() => {
    const data: Data[] | null = [
      { type: "minimum", data: minimum },
      { type: "recommended", data: recommended },
    ];

    return data.filter((item) => item?.data);
  }, [minimum, recommended]);

  if (!items?.length) return null;

  return (
    <div className="grid gap-4">
      <H5>{t("system_requirements")}</H5>
      <div className="flex gap-4 flex-2">
        {items.map((item) => (
          <RequirementsRow
            key={item?.type}
            type={item?.type}
            data={item?.data}
          />
        ))}
      </div>
    </div>
  );
};

export default PcSpecs;
