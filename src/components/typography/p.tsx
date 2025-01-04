import { cn } from "@/lib";
import { type HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLHeadingElement> {}

export const P = ({ children, className, ...props }: Props) => {
  return (
    <p className={cn("leading-7  font-nunito", className)} {...props}>
      {children}
    </p>
  );
};
