import { Badge } from "@/components/ui/badge";
import { H2, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

export const ProtonHeader = () => {
	const { t } = useLanguageContext();

	return (
		<div className="flex-shrink-0">
			<div className="mb-2 flex items-center gap-2">
				<H2 className="mb-0">{t("proton.title")}</H2>
				<Badge variant="secondary" className="text-xs">
					{t("beta")}
				</Badge>
			</div>
			<TypographyMuted>{t("proton.description")}</TypographyMuted>
		</div>
	);
};
