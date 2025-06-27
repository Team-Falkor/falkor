import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { H5, P, TypographyMuted } from "@/components/ui/typography";
import { cn, trpc } from "@/lib";
import LogSwitch from "./logSwitch";

interface LogWindowProps {
	enabled: boolean;
}

const LogWindow = ({ enabled }: LogWindowProps) => {
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	// Get all logs and dates
	const { data: allLogs } = trpc.logging.getLogs.useQuery(undefined, {
		enabled,
	});
	const { data: dates } = trpc.logging.getLoggerDates.useQuery(undefined, {
		enabled,
	});

	// Filter logs by selected date
	const { data: filteredLogs } = trpc.logging.filterLogs.useQuery(
		{
			date: selectedDate ? new Date(selectedDate) : undefined,
		},
		{
			enabled: enabled && selectedDate !== null,
		},
	);

	// Memoized calculations for performance
	const displayLogs = useMemo(() => {
		return selectedDate === null ? allLogs : filteredLogs;
	}, [selectedDate, allLogs, filteredLogs]);

	// Memoized date formatting function
	const formatDate = useCallback((dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}, []);

	// Memoized log counts per date to avoid recalculation
	const logCountsByDate = useMemo(() => {
		if (!allLogs || !dates) return new Map();

		const counts = new Map<string, number>();
		dates.forEach((date) => {
			const targetDate = new Date(date).toDateString();
			const count = allLogs.filter((log) => {
				const logDate = new Date(log.timestamp).toDateString();
				return logDate === targetDate;
			}).length;
			counts.set(date, count);
		});
		return counts;
	}, [allLogs, dates]);

	// Memoized callback for date selection
	const handleDateSelect = useCallback((date: string | null) => {
		setSelectedDate(date);
	}, []);

	// Pagination for performance with large datasets
	const ITEMS_PER_PAGE = 100;
	const [currentPage, setCurrentPage] = useState(0);

	// Paginated logs for better performance
	const paginatedLogs = useMemo(() => {
		if (!displayLogs) return [];
		const startIndex = currentPage * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		return displayLogs.slice(startIndex, endIndex);
	}, [displayLogs, currentPage]);

	const totalPages = Math.ceil((displayLogs?.length || 0) / ITEMS_PER_PAGE);
	const hasMoreLogs = (displayLogs?.length || 0) > ITEMS_PER_PAGE;

	// Reset page when logs change
	useEffect(() => {
		setCurrentPage(0);
	}, []);

	const handleLoadMore = useCallback(() => {
		if (currentPage < totalPages - 1) {
			setCurrentPage((prev) => prev + 1);
		}
	}, [currentPage, totalPages]);

	return (
		<div
			className={cn("transition-all duration-300 ease-in-out", {
				"mt-6": enabled,
				"h-0 overflow-hidden opacity-0": !enabled,
			})}
		>
			{enabled && (
				<Card className="h-[600px] w-full overflow-hidden py-0 shadow-lg">
					<div className="flex h-full">
						{/* Sidebar */}
						<div className="flex w-72 flex-col border-muted border-r bg-muted/20">
							<CardHeader className="flex-shrink-0 border-muted border-b p-4">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<P className="font-semibold text-foreground text-sm">
										Filter by Date
									</P>
								</div>
								<TypographyMuted className="text-xs">
									Select a date to view specific logs
								</TypographyMuted>
							</CardHeader>
							<ScrollArea className="flex-1">
								<div className="space-y-2 p-4">
									{/* All logs option */}
									<Button
										variant={selectedDate === null ? "secondary" : "ghost"}
										size="sm"
										className="h-auto w-full justify-between rounded-lg px-3 py-3 transition-all hover:shadow-sm"
										onClick={() => handleDateSelect(null)}
									>
										<div className="flex flex-col items-start text-left">
											<div className="font-medium">All Logs</div>
											<TypographyMuted className="text-xs">
												Show all entries
											</TypographyMuted>
										</div>
										<Badge variant="outline" className="ml-2 bg-background">
											{allLogs?.length || 0}
										</Badge>
									</Button>

									<Separator className="my-3" />

									{/* Date options */}
									{dates?.map((date) => {
										const logCount = logCountsByDate.get(date) || 0;
										return (
											<Button
												key={date}
												variant={selectedDate === date ? "secondary" : "ghost"}
												size="sm"
												className="h-auto w-full justify-between rounded-lg px-3 py-3 transition-all hover:shadow-sm"
												onClick={() => handleDateSelect(date)}
											>
												<div className="flex flex-col items-start text-left">
													<div className="font-medium">{formatDate(date)}</div>
													<TypographyMuted className="text-xs">
														{logCount} {logCount === 1 ? "entry" : "entries"}
													</TypographyMuted>
												</div>
												<Badge variant="outline" className="ml-2 bg-background">
													{logCount}
												</Badge>
											</Button>
										);
									})}
								</div>
							</ScrollArea>
						</div>

						{/* Main content area */}
						<div className="flex h-full min-h-0 flex-1 flex-col">
							{/* Header */}
							<CardHeader className="flex-shrink-0 border-muted border-b p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
											<div className="h-3 w-3 rounded-sm bg-primary" />
										</div>
										<div>
											<P className="font-semibold text-sm">
												{selectedDate === null
													? "All Logs"
													: `Logs for ${formatDate(selectedDate)}`}
											</P>
											<TypographyMuted className="text-xs">
												Developer console output
											</TypographyMuted>
										</div>
									</div>
									<Badge variant="secondary" className="bg-muted">
										{displayLogs?.length || 0} entries
									</Badge>
								</div>
							</CardHeader>

							{/* Logs content */}
							<div className="flex min-h-0 flex-1 flex-col">
								{displayLogs?.length ? (
									<>
										<ScrollArea className="min-h-0 flex-1">
											<div className="space-y-1 p-4">
												{paginatedLogs.map((log) => (
													<LogSwitch
														{...log}
														key={`${log.timestamp}-${log.message?.substring(0, 50)}`}
													/>
												))}
											</div>
										</ScrollArea>

										{/* Pagination controls */}
										{hasMoreLogs && (
											<div className="flex flex-shrink-0 items-center justify-between border-muted border-t bg-muted/10 px-4 py-3">
												<TypographyMuted className="text-xs">
													Showing {currentPage * ITEMS_PER_PAGE + 1}-
													{Math.min(
														(currentPage + 1) * ITEMS_PER_PAGE,
														displayLogs.length,
													)}{" "}
													of {displayLogs.length} logs
												</TypographyMuted>
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														disabled={currentPage === 0}
														onClick={() =>
															setCurrentPage((prev) => Math.max(0, prev - 1))
														}
													>
														Previous
													</Button>
													<Button
														variant="outline"
														size="sm"
														disabled={currentPage >= totalPages - 1}
														onClick={handleLoadMore}
													>
														Next
													</Button>
												</div>
											</div>
										)}
									</>
								) : (
									<div className="flex h-64 flex-col items-center justify-center text-center">
										<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
											<div className="h-6 w-6 rounded-md bg-muted-foreground/20" />
										</div>
										<H5 className="text-muted-foreground">No logs found</H5>
										<TypographyMuted className="mt-2 max-w-sm text-center text-sm">
											{selectedDate === null
												? "No logs have been recorded yet"
												: "No logs found for this date. Try selecting a different date or view all logs."}
										</TypographyMuted>
									</div>
								)}
							</div>
						</div>
					</div>
				</Card>
			)}
		</div>
	);
};

export default LogWindow;
