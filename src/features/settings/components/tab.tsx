import { P } from "@/components/typography/p";
import { cn } from "@/lib/utils";
import { JSX } from "react";

interface SettingTabProps {
  title: string;
  icon: JSX.Element;
  isActive: boolean;
  onClick: () => void;
}

const SettingTab = ({ icon, title, isActive, onClick }: SettingTabProps) => {
  return (
    <button
      className={cn([
        "flex items-center w-full gap-3 p-3.5 text-sm font-medium transition-all group hover:opacity-80 hover:bg-muted/50 duration-200",
        {
          "border-r-4 bg-purple-600/25 border-purple-600": isActive,
          "text-secondary-foreground/50": !isActive,
        },
      ])}
      aria-current="page"
      onClick={onClick}
    >
      {icon}
      <P className="truncate">{title}</P>
    </button>
  );
};

export default SettingTab;
