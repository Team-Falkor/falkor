"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function Tabs({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn("flex h-full flex-col gap-4", className)}
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

	const updateIndicator = useCallback(() => {
		const listElement = listRef.current;
		if (!listElement) return;

		const activeTrigger = listElement.querySelector<HTMLButtonElement>(
			'[data-state="active"]',
		);

		if (activeTrigger) {
			setIndicatorStyle({
				left: activeTrigger.offsetLeft,
				width: activeTrigger.offsetWidth,
			});
		} else {
			setIndicatorStyle({ left: 0, width: 0 });
		}
	}, []);

	useEffect(() => {
		const listElement = listRef.current;
		if (!listElement) return;

		let animationFrameId: number;

		const handleUpdate = () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			animationFrameId = requestAnimationFrame(() => {
				updateIndicator();
			});
		};

		handleUpdate(); // Initial update

		const mutationObserver = new MutationObserver(handleUpdate);
		mutationObserver.observe(listElement, {
			attributes: true,
			subtree: true,
			attributeFilter: ["data-state"],
		});

		const resizeObserver = new ResizeObserver(handleUpdate);
		resizeObserver.observe(listElement);

		// Observe each direct child (TabsTrigger) for individual size changes
		Array.from(listElement.children).forEach((child) => {
			if (child instanceof HTMLElement) {
				resizeObserver.observe(child);
			}
		});

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			mutationObserver.disconnect();
			resizeObserver.disconnect();
		};
	}, [updateIndicator]);

	return (
		<div className="relative flex-none overflow-hidden">
			<TabsPrimitive.List
				ref={listRef}
				data-slot="tabs-list"
				className={cn(
					// Removed inline-flex, used just 'flex'
					// Removed grid grid-cols-2
					"relative flex h-10 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground",
					"w-full", // This remains crucial for spanning the parent's width
					className,
				)}
				{...props}
			>
				<div
					className="absolute inset-y-1 rounded-full border-2 border-primary bg-primary/80 transition-all duration-300 ease-in-out"
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
				"relative z-10 inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary-foreground",
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
			className={cn(
				"flex-1 outline-none data-[state=inactive]:hidden",
				className,
			)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
