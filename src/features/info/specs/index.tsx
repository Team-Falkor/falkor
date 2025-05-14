import { useMemo } from "react";
import type { PcRequirements } from "@/@types";
import { H5 } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import RequirementsRow from "./row";

type PcSpecsProps = PcRequirements;

export type RequirementsData = {
	type: "minimum" | "recommended";
	data: string | undefined | null;
};

const PcSpecs = ({ minimum, recommended }: PcSpecsProps) => {
	const { t } = useLanguageContext();

	const items = useMemo(() => {
		const data: RequirementsData[] | null = [
			{ type: "minimum", data: minimum },
			{ type: "recommended", data: recommended },
		];

		return data.filter((item) => item?.data);
	}, [minimum, recommended]);

	if (!items?.length) return null;

	return (
		<div className="grid gap-4">
			<H5>{t("system_requirements")}</H5>
			<div className="flex flex-2 gap-4">
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
