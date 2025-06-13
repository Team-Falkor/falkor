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
				"space-y-4 overflow-hidden rounded-lg bg-muted/60 p-4 shadow-md",
				className,
			)}
			{...props}
		>
			{(title || description) && (
				<div className={cn("mb-4 flex flex-col overflow-hidden")}>
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
