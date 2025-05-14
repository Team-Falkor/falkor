import type React from "react";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib";
import { Input } from "./ui/input";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
	startIcon?: React.ReactElement;
	endIcon?: React.ReactElement;
	divClassName?: string;
	onFocus?: React.FocusEventHandler<HTMLInputElement>;
	onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export const InputWithIcon = forwardRef<HTMLInputElement, Props>(
	(
		{
			className,
			type,
			startIcon,
			endIcon,
			divClassName,
			onFocus,
			onBlur,
			...props
		},
		ref,
	) => {
		const StartIcon = startIcon;
		const EndIcon = endIcon;

		return (
			<div className={cn("relative w-full", divClassName)}>
				{StartIcon && (
					<div className="-translate-y-1/2 absolute top-1/2 left-1.5 transform text-muted-foreground *:size-4">
						{startIcon}
					</div>
				)}

				<Input
					type={type}
					className={cn(
						{
							"pl-8": startIcon,
							"pr-8": endIcon,
						},
						className,
					)}
					ref={ref}
					onFocus={onFocus}
					onBlur={onBlur}
					{...props}
				/>

				{EndIcon && (
					<div className="-translate-y-1/2 absolute top-1/2 right-3 transform text-muted-foreground *:size-4">
						{endIcon}
					</div>
				)}
			</div>
		);
	},
);

InputWithIcon.displayName = "InputWithIcon";
