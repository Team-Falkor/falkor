import { cn } from "@/lib";
import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLParagraphElement> {}

export const TypographyMuted = ({ children, className, ...props }: Props) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground font-nunito", className)}
      {...props}
    >
      {children}
    </p>
  );
};
