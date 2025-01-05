import { cn } from "@/lib";
import { type HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLHeadingElement> {}

export const H4 = ({ children, className, ...props }: Props) => {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight font-nunito",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
};
