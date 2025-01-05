import { H3 } from "@/components/typography/h3";
import { cn } from "@/lib";
import { HTMLAttributes } from "react";

interface SettingTitleProps extends HTMLAttributes<HTMLDivElement> {
  children: string;
}

const SettingTitle = ({ children, className, ...props }: SettingTitleProps) => {
  return (
    <div className={cn("p-7 pb-5", className)} {...props}>
      <H3>{children}</H3>
    </div>
  );
};

export default SettingTitle;
