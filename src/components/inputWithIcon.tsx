import { cn } from "@/lib";
import React, { forwardRef, InputHTMLAttributes } from "react";
import { Input } from "./ui/input";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactElement;
  endIcon?: React.ReactElement;
  divClassName?: string;
}

export const InputWithIcon = forwardRef<HTMLInputElement, Props>(
  ({ className, type, startIcon, endIcon, divClassName, ...props }, ref) => {
    const StartIcon = startIcon;
    const EndIcon = endIcon;

    return (
      <div className={cn("relative w-full", divClassName)}>
        {StartIcon && (
          <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2 *:size-4 text-muted-foreground">
            {startIcon}
          </div>
        )}

        <Input
          type={type}
          className={cn({
            "pl-8": startIcon,
            "pr-8": endIcon,
          })}
          ref={ref}
          {...props}
        />

        {EndIcon && (
          <div className="absolute transform -translate-y-1/2 right-3 top-1/2 *:size-4 text-muted-foreground">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);
