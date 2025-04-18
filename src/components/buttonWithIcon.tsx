import { cn } from "@/lib";
import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Button } from "./ui/button";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  startIcon?: React.ReactElement;
  endIcon?: React.ReactElement;
  divClassName?: string;
}

export const ButtonWithIcon = forwardRef<HTMLButtonElement, Props>(
  (
    { className, type, startIcon, endIcon, divClassName, children, ...props },
    ref
  ) => {
    const StartIcon = startIcon;
    const EndIcon = endIcon;

    return (
      <Button
        className={cn(
          "flex items-center relative overflow-hidden justify-center w-full px-4",
          className
        )}
        ref={ref}
        {...props}
      >
        {StartIcon && (
          <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </div>
        )}

        <span
          className={cn("truncate capitalize", {
            "pl-6": startIcon,
            "pr-6": endIcon,
          })}
        >
          {children}
        </span>

        {EndIcon && (
          <div className="absolute transform -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
            {endIcon}
          </div>
        )}
      </Button>
    );
  }
);
