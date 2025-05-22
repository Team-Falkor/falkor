import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn, trpc } from "@/lib"; // Ensure you have the correct import path for cn from shadcn

interface TitleBarControlProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	controlType: "minimize" | "maximize" | "close";
}

const TitleBarControl = ({
	controlType,
	className,
	children,
	...props
}: PropsWithChildren<TitleBarControlProps>) => {
	const minimizeMutation = trpc.app.minimize.useMutation();
	const maximizeMutation = trpc.app.maximize.useMutation();
	const closeMutation = trpc.app.close.useMutation();

	const handleClick = () => {
		switch (controlType) {
			case "minimize":
				minimizeMutation.mutate();
				break;
			case "maximize":
				maximizeMutation.mutate();
				break;
			case "close":
				closeMutation.mutate();
				break;
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-label={controlType}
			className={cn(
				"titlebar-button group focus-statesring-muted-foreground focus-statesring-offset-1 transform cursor-pointer rounded-full p-1 outline-none transition-transform focus-states:scale-110 focus-visible:ring-2",
				className,
			)}
			{...props}
		>
			{children ? (
				children
			) : (
				<svg
					width="14"
					height="14"
					className="h-full w-full"
					role="img"
					aria-label={controlType}
				>
					<circle cx="7" cy="7" r="6" />
				</svg>
			)}
		</button>
	);
};

export default TitleBarControl;
