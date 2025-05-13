import type { PropsWithChildren } from "react";
import { Label } from "@/components/ui/label";
import { useLanguageContext } from "@/i18n/I18N";

type Props = {
	title: string;
};

export const SettingsItem = ({ title, children }: PropsWithChildren<Props>) => {
	const { t } = useLanguageContext();

	return (
		<div className="flex items-center justify-between gap-6">
			<Label
				htmlFor={title}
				className="flex-shrink-0 font-medium text-foreground text-sm"
			>
				{t(`settings.settings.${title}`)}
			</Label>

			<div className="flex items-center justify-end">{children}</div>
		</div>
	);
};
