import { useMemo } from "react";
import {
	H4,
	TypographyMuted,
	TypographySmall,
} from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { scrapeOptions } from "@/lib";
import type { RequirementsData } from ".";

type RequirementsRowProps = RequirementsData;

const RequirementsRow = ({ type, data }: RequirementsRowProps) => {
	const { t } = useLanguageContext();
	const specs = useMemo(() => !!data && scrapeOptions(data), [data]);

	const isSpecsEm = useMemo(() => Object.values(specs).length, [specs]);

	if (!data) return null;
	if (!isSpecsEm) return null;

	return (
		<div className="flex w-full shrink-0 flex-col gap-2 overflow-hidden rounded-2xl bg-card p-4">
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
