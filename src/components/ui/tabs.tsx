"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function Tabs({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn("flex flex-col gap-2", className)}
			{...props}
		/>
	);
}

function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	const listRef = useRef<React.ElementRef<typeof TabsPrimitive.List>>(null);
	const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

	useEffect(() => {
		const listElement = listRef.current;
		if (!listElement) return;

		const updateIndicator = () => {
			const activeTrigger = listElement.querySelector<HTMLButtonElement>(
				'[data-state="active"]',
			);

			if (activeTrigger) {
				setIndicatorStyle({
					left: activeTrigger.offsetLeft,
					width: activeTrigger.offsetWidth,
				});
			}
		};

		updateIndicator();

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (
					mutation.type === "attributes" &&
					mutation.attributeName === "data-state"
				) {
					updateIndicator();
					break;
				}
			}
		});

		observer.observe(listElement, {
			attributes: true,
			subtree: true,
			attributeFilter: ["data-state"],
		});

		return () => observer.disconnect();
	}, []);

	return (
		<div className="relative inline-block">
			<TabsPrimitive.List
				ref={listRef}
				data-slot="tabs-list"
				className={cn(
					"relative inline-flex h-10 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground",
					className,
				)}
				{...props}
			>
				<div
					className="absolute top-1 bottom-1 left-0 rounded-full border-2 border-primary bg-primary/80 transition-all duration-300 ease-in-out"
					style={indicatorStyle}
				/>
				{props.children}
			</TabsPrimitive.List>
		</div>
	);
}

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn("flex-1 outline-none", className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
