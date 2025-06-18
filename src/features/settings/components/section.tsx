import type { HTMLAttributes, PropsWithChildren } from "react";
import { H3, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib";

interface Props extends HTMLAttributes<HTMLDivElement> {
	title?: string;
	description?: string;
}

export const SettingsSection = ({
	children,
	title,
	description,
	className,
	...props
}: PropsWithChildren<Props>) => {
	const { t } = useLanguageContext();

	return (
		<div
			className={cn(
				"space-y-6 overflow-hidden rounded-lg bg-muted/30 p-6 shadow-sm",
				className,
			)}
			{...props}
		>
			{(title || description) && (
				<div className="space-y-1">
					{title && <H3>{t(`settings.settings.${title}`)}</H3>}
					{description && (
						<TypographyMuted>
							{t(`settings.settings.${description}`)}
						</TypographyMuted>
					)}
				</div>
			)}
			{children}
		</div>
	);
};
