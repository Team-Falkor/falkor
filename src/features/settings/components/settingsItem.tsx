import type { PropsWithChildren } from "react";
import { Label } from "@/components/ui/label";
import { TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib/utils"; // Assuming you have a className utility

type SettingsItemProps = {
	title: string;
	className?: string;
	id?: string;
	fullWidth?: boolean;
};

export const SettingsItem = ({
	title,
	children,
	className,
	id,
}: PropsWithChildren<SettingsItemProps>) => {
	const { t } = useLanguageContext();

	const titleKey = `settings.settings.${title}`;
	const description = t(`${titleKey}-description`);
	const isDescriptionEmpty = description === `${titleKey}-description`;
	const itemId = id || title;

	return (
		<div
			className={cn(
				"flex w-full max-w-full flex-col items-start justify-between gap-2 py-2 sm:flex-row sm:items-center sm:gap-6",
				className,
			)}
		>
			<Label
				htmlFor={itemId}
				className="mb-1 font-medium text-foreground text-sm sm:mb-0"
			>
				<div className="flex flex-col">
					<span>{t(titleKey)}</span>
					{!isDescriptionEmpty && (
						<TypographyMuted className="mt-0.5 max-w-md text-xs">
							{description}
						</TypographyMuted>
					)}
				</div>
			</Label>

			<div className="flex w-full items-center justify-end sm:w-auto">
				{children}
			</div>
		</div>
	);
};
