import { cn } from "@/lib";
import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLElement> {}

export const TypographySmall = ({ children, className, ...props }: Props) => {
  return (
    <small
      className={cn("text-sm font-medium leading-none font-nunito", className)}
      {...props}
    >
      {children}
    </small>
  );
};
