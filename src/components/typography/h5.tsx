import { cn } from "@/lib";
import { type HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLHeadingElement> {}

export const H5 = ({ children, className, ...props }: Props) => {
  return (
    <h5
      className={cn(
        "scroll-m-20 text-lg font-semibold tracking-tight font-nunito",
        className
      )}
      {...props}
    >
      {children}
    </h5>
  );
};
