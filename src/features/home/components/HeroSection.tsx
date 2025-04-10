import { buttonVariants } from "@/components/ui/button";
import { H1, TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/contexts/I18N";
import { Link } from "@tanstack/react-router";

const HeroSection = () => {
  const { t } = useLanguageContext();

  return (
    <div className="relative w-full mb-10 overflow-hidden rounded-xl bg-linear-to-br from-background via-secondary/30 to-primary/20 p-8">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-linear-to-bl from-primary to-transparent rounded-l-full"></div>
      <div className="relative z-10 flex flex-col items-start max-w-3xl gap-4">
        <H1 className="flex items-end gap-2">
          {t("falkor")}
          <TypographyMuted>{t("logo_hover")}</TypographyMuted>
        </H1>
        <TypographyMuted className="text-lg">
          Discover, play, and manage your favorite games in one place
        </TypographyMuted>
        <div className="flex gap-4 mt-2">
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
