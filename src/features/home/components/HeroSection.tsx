import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { H1, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

const HeroSection = () => {
	const { t } = useLanguageContext();

	return (
		<div className="relative mb-10 w-full overflow-hidden rounded-xl bg-linear-to-br from-background via-secondary/30 to-primary/20 p-8">
			<div className="absolute top-0 right-0 h-full w-1/2 rounded-l-full bg-linear-to-bl from-primary to-transparent opacity-10" />
			<div className="relative z-10 flex max-w-3xl flex-col items-start gap-4">
				<H1 className="flex items-end gap-2">
					{t("falkor")}
					<TypographyMuted>{t("logo_hover")}</TypographyMuted>
				</H1>
				<TypographyMuted className="text-lg">
					Discover, play, and manage your favorite games in one place
				</TypographyMuted>
				<div className="mt-2 flex gap-4">
					<Link
						to="/library"
						className={buttonVariants({
							variant: "active",
						})}
					>
						Browse Library
					</Link>
				</div>
			</div>
		</div>
	);
};

export default HeroSection;
