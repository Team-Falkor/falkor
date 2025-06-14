import { Link, type LinkProps } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, FunctionComponent, JSX } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItemProps =
	| {
			title: string;
			href: LinkProps["to"];
			icon: JSX.Element;
			type?: "link";
	  }
	| ({
			type: "button";
			title: string;
			icon: JSX.Element;
			active?: boolean;
	  } & ButtonHTMLAttributes<HTMLButtonElement>);

const NavItem: FunctionComponent<NavItemProps> = (props) => {
	const { icon, title, type } = props;

	if (!type || type === "link") {
		const { href } = props;

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Link
						to={href}
						className={buttonVariants({
							variant: "ghost",
							size: "icon",
							className: "rounded-lg focus-states:bg-muted [&.active]:bg-muted",
						})}
					>
						<div className="*:size-5">{icon}</div>
					</Link>
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={8} className="capitalize">
					{title}
				</TooltipContent>
			</Tooltip>
		);
	}

	if (type === "button") {
		const { active, ...rest } = props;
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className={cn([
							"rounded-lg",
							{
								"bg-muted": active,
							},
						])}
						{...rest}
					>
						<div className="*:size-5">{icon}</div>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={8}>
					{title}
				</TooltipContent>
			</Tooltip>
		);
	}
};

export default NavItem;
