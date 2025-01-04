import { cn } from "@/lib";
import { type HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLHeadingElement> {}

export const H1 = ({ children, className, ...props }: Props) => {
  return (
    <h1
      className={cn(
        "text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl font-poppins",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
};
