import { Progress } from "@/components/ui/progress";
import { H5, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

interface ProtonInstallationProgressProps {
	installingVersion: string;
	installProgress: number;
	installStatus: string;
}

export const ProtonInstallationProgress = ({
	installingVersion,
	installProgress,
	installStatus,
}: ProtonInstallationProgressProps) => {
	const { t } = useLanguageContext();

	return (
		<div className="flex-shrink-0 rounded-lg border bg-muted/50 p-4">
			<div className="mb-2 flex items-center justify-between">
				<H5>
					{t("proton.installing")} {installingVersion}
				</H5>
				<TypographyMuted>{installProgress}%</TypographyMuted>
			</div>
			<Progress value={installProgress} className="mb-2" />
			<TypographyMuted className="text-sm">{installStatus}</TypographyMuted>
		</div>
	);
};