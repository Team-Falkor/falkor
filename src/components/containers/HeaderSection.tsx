import { goBack } from "@/lib/history";
import { ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";
import { H1, TypographyMuted } from "../ui/typography";

type HeaderSectionProps = {
  title: string;
  subtitle?: string;
};

export const HeaderSection = ({ title, subtitle }: HeaderSectionProps) => {
  return (
    <div className="pb-4  px-1 sm:px-0">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          aria-label="Go back"
          className="flex-shrink-0 mt-1"
        >
          <ChevronLeft className="size-6 sm:size-7" />
        </Button>
        <div className="flex-grow min-w-0">
          <H1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">
            {title}
          </H1>
          {subtitle && (
            <TypographyMuted className="text-sm sm:text-base mt-1">
              {subtitle}
            </TypographyMuted>
          )}
        </div>
      </div>
    </div>
  );
};
