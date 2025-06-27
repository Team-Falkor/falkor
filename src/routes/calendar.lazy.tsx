import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { RouterOutputs } from "@/@types";
import IGDBImage from "@/components/IGDBImage";
import GameLoader from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { H5 } from "@/components/ui/typography";
import { trpc } from "@/lib";

type Game = RouterOutputs["igdb"]["calendarReleases"][number];
type ReleaseMap = Record<string, Game[]>;

export const Route = createLazyFileRoute("/calendar")({
	component: CalendarRoute,
});

function CalendarRoute() {
	const [currentMonth, setCurrentMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});

	const queryVars = useMemo(
		() => ({
			year: currentMonth.getFullYear(),
			month: currentMonth.getMonth(),
			limit: 250,
			offset: 0,
		}),
		[currentMonth],
	);

	const {
		data: releases = [],
		isLoading,
		error,
	} = trpc.igdb.calendarReleases.useQuery(queryVars, {
		staleTime: 1000 * 60 * 5,
	});

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

	const sortedDates = useMemo(() => {
		return Object.keys(releasesByDate).sort();
	}, [releasesByDate]);

	const navigateMonth = useCallback((offset: number) => {
		setCurrentMonth((m) => {
			try {
				const newDate = new Date(m.getFullYear(), m.getMonth() + offset, 1);
				if (Number.isNaN(newDate.getTime())) throw new Error("Invalid date");
				return newDate;
			} catch (err) {
				console.error("Navigation error:", err);
				return m;
			}
		});
	}, []);

	const prevMonth = useCallback(() => navigateMonth(-1), [navigateMonth]);
	const nextMonth = useCallback(() => navigateMonth(1), [navigateMonth]);

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const day = date.getDate().toString().padStart(2, "0");
		const month = date
			.toLocaleString("default", { month: "short" })
			.toUpperCase();
		const weekday = date.toLocaleString("default", { weekday: "long" });
		return { day, month, weekday };
	};

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
		<div className="min-h-screen">
			<div className="sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
				<div className="mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<Button variant="ghost" size="icon" onClick={prevMonth}>
							<ChevronLeft className="h-5 w-5" />
						</Button>
						<div className="text-center">
							<h1 className="text-xl">
								{currentMonth.toLocaleString("default", { month: "long" })}{" "}
								{currentMonth.getFullYear()}
							</h1>
						</div>
						<Button variant="ghost" size="icon" onClick={nextMonth}>
							<ChevronRight className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>

			<div className="mx-auto p-6 lg:px-10">
				{sortedDates.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground">
						<p>No game releases found for this month.</p>
					</div>
				) : (
					<div className="space-y-12">
						{sortedDates.map((dateStr) => {
							const { day, month, weekday } = formatDate(dateStr);
							const games = releasesByDate[dateStr];

							return (
								<div key={dateStr} className="space-y-6">
									<div className="space-y-1">
										<div className="font-medium text-muted-foreground text-sm">
											{currentMonth.getFullYear()}
										</div>
										<div className="flex items-baseline gap-3">
											<h2 className="font-bold text-4xl">
												{day} {month}
											</h2>
											<span className="text-muted-foreground text-sm capitalize">
												{weekday}
											</span>
										</div>
									</div>

									<div
										className="grid gap-6"
										style={{
											gridTemplateColumns:
												"repeat(auto-fill, minmax(250px, 1fr))",
										}}
									>
										{games.map((game) => (
											<Link
												key={game.id}
												to="/info/$id"
												params={{ id: String(game.id) }}
												className="block transition-transform hover:scale-105"
											>
												<div className="overflow-hidden transition-colors">
													<div className="relative">
														<div className="relative flex aspect-video items-center justify-center overflow-hidden">
															{game.cover?.image_id ? (
																<IGDBImage
																	imageId={game.cover.image_id}
																	imageSize="screenshot_med"
																	alt={game.name || "Game cover"}
																	className="h-full w-full rounded-lg object-cover"
																/>
															) : (
																<>
																	<div className="rotate-12 transform font-bold text-6xl text-destructive opacity-50">
																		GAME OVER
																	</div>
																	<Badge
																		variant="destructive"
																		className="absolute top-2 left-2"
																	>
																		<AlertTriangle className="mr-1 h-3 w-3" />
																		Error
																	</Badge>
																</>
															)}
														</div>

														<div className="pt-2">
															<H5 className="line-clamp-2 overflow-hidden font-medium text-sm leading-tight">
																{game.name ?? "Unknown Game"}
															</H5>
														</div>
													</div>
												</div>
											</Link>
										))}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
