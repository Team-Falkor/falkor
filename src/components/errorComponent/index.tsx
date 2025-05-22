import { type ErrorComponentProps, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { cn, shouldHideTitleBar } from "@/lib";
import { Button, buttonVariants } from "../ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { H2, P, TypographyMuted } from "../ui/typography";

const ErrorComponent = (props: ErrorComponentProps) => {
	const { settings } = useSettings();

	return (
		<div
			className={cn(
				"flex h-screen w-full flex-col items-center justify-center",
				{
					"h-[calc(100vh-2rem)]": !shouldHideTitleBar(settings?.titleBarStyle),
				},
			)}
		>
			<Card className="fade-in-50 w-full max-w-[95%] animate-in border-destructive/20 shadow-lg duration-300 ease-in-out md:max-w-[75vw]">
				<CardHeader className="pb-2">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
							<AlertTriangle className="h-5 w-5 text-destructive" />
						</div>
						<div>
							<CardTitle>
								<H2 className="text-destructive">{props.error.name}</H2>
							</CardTitle>
							<TypographyMuted className="mt-1">
								{props.error.message}
							</TypographyMuted>
						</div>
					</div>
				</CardHeader>

				<CardContent className="pb-4">
					<P className="mb-3">
						We encountered an unexpected error. The details below may help
						identify the issue:
					</P>
					<ScrollArea className="h-[75vh] min-h-[150px] rounded-md border bg-muted/30 p-4 md:h-[35vh]">
						<pre className="w-full whitespace-pre-wrap text-balance p-2 font-mono text-muted-foreground text-sm">
							{props.error.stack}
						</pre>
					</ScrollArea>
				</CardContent>

				<Separator className="mb-4" />

				<CardFooter className="flex flex-wrap justify-between gap-4">
					<div className="flex gap-3">
						<Link to="/" className={buttonVariants({ variant: "default" })}>
							Return Home
						</Link>
						<Button onClick={props.reset} variant="default">
							Try Again
						</Button>
					</div>
					<Button asChild variant="secondary" className="gap-2">
						<a
							href={
								"https://github.com/Team-Falkor/falkor/issues/new?template=bug_report.md"
							}
							target="_blank"
							rel="noopener"
						>
							<span className="hidden sm:inline">Report Issue</span>
							<span className="sm:hidden">Report</span>
						</a>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default ErrorComponent;
