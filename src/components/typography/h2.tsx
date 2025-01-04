import { cn } from "@/lib";
import { type HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLHeadingElement> {}

export const H2 = ({ children, className, ...props }: Props) => {
  return (
    <h2
      className={cn(
        "text-3xl font-semibold tracking-tight scroll-m-20 first:mt-0 font-nunito",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
};
