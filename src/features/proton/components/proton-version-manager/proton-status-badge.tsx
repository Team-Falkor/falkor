import type { ProtonVersionInfo } from "@team-falkor/game-launcher";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguageContext } from "@/i18n/I18N";

interface ProtonStatusBadgeProps {
	version: ProtonVersionInfo;
	installingVersion: string | null;
}

export const ProtonStatusBadge = ({
	version,
	installingVersion,
}: ProtonStatusBadgeProps) => {
	const { t } = useLanguageContext();

	if (installingVersion === version.version) {
		return (
			<Badge variant="secondary" className="gap-1">
				<Loader2 className="size-3 animate-spin" />
				{t("proton.installing")}
			</Badge>
		);
	}

	if (version.installed) {
		return (
			<Badge variant="default" className="gap-1">
				<CheckCircle className="size-3" />
				{t("proton.installed")}
			</Badge>
		);
	}

	return (
		<Badge variant="destructive" className="gap-1">
			<XCircle />
			{t("proton.not_installed")}
		</Badge>
	);
};