import { cn } from "@/lib";
import type { HTMLAttributes, PropsWithChildren } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

const MainContainer = ({
	children,
	className,
	id,
}: PropsWithChildren<Props>) => {
	return (
		<div className={cn("main-container", "p-6 lg:px-10", className)} id={id}>
			{children}
		</div>
	);
};

export default MainContainer;
