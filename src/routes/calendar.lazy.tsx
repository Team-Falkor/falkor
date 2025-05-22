import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { RouterOutputs } from "@/@types";
import GameLoader from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib";
import { cn } from "@/lib/utils";

type Game = RouterOutputs["igdb"]["calendarReleases"][number];
type ReleaseMap = Record<string, Game[]>;

export const Route = createLazyFileRoute("/calendar")({
	component: CalendarRoute,
});

// Static weekday labels
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function CalendarRoute() {
	const [currentMonth, setCurrentMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});

	// Build query variables
	const queryVars = useMemo(
		() => ({
			year: currentMonth.getFullYear(),
			month: currentMonth.getMonth(),
			limit: 100,
			offset: 0,
		}),
		[currentMonth],
	);

	// Fetch calendar releases
	const {
		data: releases = [],
		isLoading,
		error,
	} = trpc.igdb.calendarReleases.useQuery(
		queryVars,
		{ staleTime: 1000 * 60 * 5 }, // cache for 5 minutes
	);

	// Group releases by ISO date
	const releasesByDate = useMemo(() => {
		const map = Object.create(null) as ReleaseMap;
		for (const game of releases) {
			try {
				if (!game.first_release_date) continue;
				const date = new Date(game.first_release_date * 1000);
				if (Number.isNaN(date.getTime())) continue;

				const key = date.toISOString().slice(0, 10);
				if (!map[key]) map[key] = [];
				map[key].push(game);
			} catch (err) {
				console.error(`Error processing game ${game.id}:`, err);
			}
		}
		return map;
	}, [releases]);

	// Generate an array of Date objects filling the calendar grid
	const days = useMemo(() => {
		try {
			const year = currentMonth.getFullYear();
			const month = currentMonth.getMonth();

			// Calculate first and last day of the month
			const firstOfMonth = new Date(year, month, 1);
			const lastOfMonth = new Date(year, month + 1, 0);

			const firstDay = firstOfMonth.getDay();
			const totalDays = lastOfMonth.getDate();

			const cells: Date[] = [];
			const totalCells = Math.ceil((totalDays + firstDay) / 7) * 7;

			// Fill all cells in one loop
			for (let i = 0; i < totalCells; i++) {
				const dayOffset = i - firstDay;
				cells.push(new Date(year, month, dayOffset + 1));
			}

			return cells;
		} catch (err) {
			console.error("Error generating calendar days:", err);
			return [];
		}
	}, [currentMonth]);

	// Navigation handlers with validation
	const navigateMonth = useCallback((offset: number) => {
		setCurrentMonth((m) => {
			try {
				const newDate = new Date(m.getFullYear(), m.getMonth() + offset, 1);
				if (Number.isNaN(newDate.getTime())) throw new Error("Invalid date");
				return newDate;
			} catch (err) {
				console.error("Navigation error:", err);
				return m; // Keep current month on error
			}
		});
	}, []);

	const prevMonth = useCallback(() => navigateMonth(-1), [navigateMonth]);
	const nextMonth = useCallback(() => navigateMonth(1), [navigateMonth]);

	if (isLoading)
		return (
			<div className="flex h-[calc(100svh-35px)] items-center justify-center">
				<GameLoader />
			</div>
		);
	if (error)
		return (
			<div className="flex h-full items-center justify-center text-destructive">
				<div className="text-center">
					<h3 className="mb-2 font-semibold">Failed to load calendar data</h3>
					<p className="text-sm">{error.message}</p>
				</div>
			</div>
		);

	return (
		<div className="flex h-full flex-col p-4">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between text-base sm:text-lg">
				<Button variant="outline" size="icon" onClick={prevMonth}>
					<ChevronLeft />
				</Button>
				<h2 className="font-semibold text-lg sm:text-xl">
					{currentMonth.toLocaleString("default", { month: "long" })}{" "}
					{currentMonth.getFullYear()}
				</h2>
				<Button variant="outline" size="icon" onClick={nextMonth}>
					<ChevronRight />
				</Button>
			</div>

			{/* Weekday labels */}
			<div className="mb-2 grid grid-cols-7 text-center font-medium text-sm sm:text-base">
				{WEEKDAYS.map((d) => (
					<div key={d}>{d}</div>
				))}
			</div>

			{/* Calendar Grid */}
			<div className="flex-1 overflow-auto">
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
					{days.map((date) => {
						const key = date.toISOString().slice(0, 10);
						const games = releasesByDate[key] ?? [];
						const isCurrent = date.getMonth() === currentMonth.getMonth();

						return (
							<Card
								key={key}
								className={cn("p-1", "min-h-24", !isCurrent && "opacity-50")}
							>
								<CardHeader className="p-1">
									<div className="text-right text-xs sm:text-base">
										{date.getDate()}
									</div>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col space-y-1 overflow-hidden p-1 text-xs sm:text-sm">
									{games.slice(0, 3).map((game) => (
										<Link
											key={game.id}
											to="/info/$id"
											params={{ id: String(game.id) }}
											className={cn(
												"block truncate transition-all last:pb-1.5 focus-states:text-primary focus-states:underline",
											)}
											title={game.name}
										>
											{game.name}
										</Link>
									))}
									{games.length > 3 && (
										<div className="mt-auto self-end text-xs">
											+{games.length - 3} more
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
