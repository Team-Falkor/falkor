import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TypographyProps {
	children: ReactNode;
	className?: string;
}

export function H1({ children, className }: TypographyProps) {
	return (
		<h1
			className={cn(
				"font-bold font-poppins text-[clamp(24px,6vw,28px)] leading-tight tracking-tight",
				className,
			)}
		>
			{children}
		</h1>
	);
}

export function H2({ children, className }: TypographyProps) {
	return (
		<h2
			className={cn(
				"font-bold font-nunito text-[clamp(20px,5vw,24px)] leading-snug",
				className,
			)}
		>
			{children}
		</h2>
	);
}

export function H3({ children, className }: TypographyProps) {
	return (
		<h3
			className={cn(
				"font-bold font-nunito text-[clamp(18px,4vw,20px)] leading-snug",
				className,
			)}
		>
			{children}
		</h3>
	);
}

export function H4({ children, className }: TypographyProps) {
	return (
		<h4
			className={cn(
				"font-bold font-nunito text-[clamp(16px,3.5vw,18px)] leading-snug",
				className,
			)}
		>
			{children}
		</h4>
	);
}

export function H5({ children, className }: TypographyProps) {
	return (
		<h5
			className={cn(
				"font-bold font-nunito text-[clamp(14px,3vw,16px)] leading-snug",
				className,
			)}
		>
			{children}
		</h5>
	);
}
export function P({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-nunito text-[clamp(14px,3vw,16px)] leading-relaxed",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function SystemLabel({ children, className }: TypographyProps) {
	return (
		<span
			className={cn(
				"font-bold font-nunito text-[clamp(11px,2vw,12px)] leading-none",
				className,
			)}
		>
			{children}
		</span>
	);
}

export function TypographyMuted({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-nunito text-[clamp(14px,3vw,16px)] text-muted-foreground leading-relaxed",
				className,
			)}
		>
			{children}
		</p>
	);
}

export function TypographySmall({ children, className }: TypographyProps) {
	return (
		<p
			className={cn(
				"font-nunito text-[clamp(12px,2.5vw,13px)] leading-relaxed",
				className,
			)}
		>
			{children}
		</p>
	);
}
