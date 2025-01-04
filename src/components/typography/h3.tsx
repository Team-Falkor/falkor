import { cn } from "@/lib";
import { type HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLHeadingElement> {}

export const H3 = ({ children, className, ...props }: Props) => {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold tracking-tight scroll-m-20 font-nunito",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};
