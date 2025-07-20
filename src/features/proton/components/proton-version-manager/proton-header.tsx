import { H2, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

export const ProtonHeader = () => {
	const { t } = useLanguageContext();

	return (
		<div className="flex-shrink-0">
			<H2 className="mb-2">{t("proton.title")}</H2>
			<TypographyMuted>{t("proton.description")}</TypographyMuted>
		</div>
	);
};