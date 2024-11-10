import { cn, invoke } from "@/lib";
import { HtmlHTMLAttributes } from "react";

interface TitleBarControlProps extends HtmlHTMLAttributes<HTMLOrSVGElement> {
  type: "minimize" | "maximize" | "close";
}

const TitleBarControl = ({
  type,
  className,
  ...props
}: TitleBarControlProps) => {
  return (
    <button
      className="titlebar-button group cursor-pointer p-1 rounded-full outline-none transition-transform transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-muted-foreground"
      onClick={() => invoke(`app:${type}`)}
      aria-label={type}
    >
      <svg width="14" height="14" className={cn(className)} {...props}>
        <circle cx="7" cy="7" r="6" />
      </svg>
    </button>
  );
};

export default TitleBarControl;