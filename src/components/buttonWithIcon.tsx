import {
	type ButtonHTMLAttributes,
	forwardRef,
	type ReactElement,
} from "react";
import { cn } from "@/lib";
import { Button } from "./ui/button";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	startIcon?: ReactElement;
	endIcon?: ReactElement;
	divClassName?: string;
}

export const ButtonWithIcon = forwardRef<HTMLButtonElement, Props>(
	(
		{ className, type, startIcon, endIcon, divClassName, children, ...props },
		ref,
	) => {
		const StartIcon = startIcon;
		const EndIcon = endIcon;

		return (
			<Button
				className={cn(
					"relative flex w-full items-center justify-center overflow-hidden px-4",
					className,
				)}
				ref={ref}
				{...props}
			>
				{StartIcon && (
					<div className="-translate-y-1/2 absolute top-1/2 left-1.5 transform text-muted-foreground">
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
					<div className="-translate-y-1/2 absolute top-1/2 right-3 transform text-muted-foreground">
						{endIcon}
					</div>
				)}
			</Button>
		);
	},
);
