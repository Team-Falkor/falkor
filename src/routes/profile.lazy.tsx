import { createLazyFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Lock, Trophy } from "lucide-react";
import type { RouterOutputs } from "@/@types";
import MainContainer from "@/components/containers/mainContainer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute("/profile")({
	component: RouteComponent,
});

type AchievementsData = RouterOutputs["achievements"]["getAll"];
type Achievement = AchievementsData[number];

interface StatsCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
	showProgress?: boolean;
	progressValue?: number;
	className?: string;
}

function StatsCard({
	title,
	value,
	subtitle,
	showProgress,
	progressValue,
	className,
}: StatsCardProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<p className="font-medium text-muted-foreground text-xs sm:text-sm">
				{title}
			</p>
			<div className="flex items-baseline gap-2">
				<span className="font-bold text-2xl text-primary sm:text-3xl">
					{value}
				</span>
				{subtitle && (
					<span className="text-base text-muted-foreground sm:text-lg">
						{subtitle}
					</span>
				)}
			</div>
			{showProgress && progressValue !== undefined && (
				<Progress value={progressValue} className="h-2" />
			)}
		</div>
	);
}

interface RecentAchievementProps {
	achievement: Achievement;
	className?: string;
}

function RecentAchievement({ achievement, className }: RecentAchievementProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3",
				className,
			)}
		>
			<img
				src={achievement.game.gameIcon ?? undefined}
				alt={achievement.game.gameName}
				className="h-6 w-6 rounded sm:h-8 sm:w-8"
			/>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-xs sm:text-sm">
					{achievement.achievementDisplayName}
				</p>
				<p className="text-muted-foreground text-xs">
					{achievement.game.gameName}
				</p>
			</div>
		</div>
	);
}

interface AchievementItemProps {
	achievement: Achievement;
	formatUnlockedDate: (date: Achievement["unlockedAt"]) => string;
	className?: string;
}

function AchievementItem({
	achievement,
	formatUnlockedDate,
	className,
}: AchievementItemProps) {
	return (
		<Card
			className={cn(
				"h-full min-w-72 transition-colors hover:bg-muted/50",
				achievement.unlocked
					? "border-primary/20 bg-primary/5"
					: "border-border bg-muted/20",
				className,
			)}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					<div className="mt-0.5 flex-shrink-0">
						{achievement.unlocked ? (
							<CheckCircle2 className="h-4 w-4 text-primary" />
						) : (
							<Lock className="h-4 w-4 text-muted-foreground" />
						)}
					</div>

					<div className="min-w-0 flex-1 space-y-2">
						<h4
							className={cn(
								"font-medium text-sm leading-tight",
								achievement.unlocked
									? "text-foreground"
									: "text-muted-foreground",
							)}
						>
							{achievement.achievementDisplayName}
						</h4>

						{achievement.unlocked && achievement.unlockedAt && (
							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<Calendar className="h-3 w-3" />
								<span>{formatUnlockedDate(achievement.unlockedAt)}</span>
							</div>
						)}

						{achievement.description && (
							<p className="line-clamp-3 text-muted-foreground text-xs">
								{achievement.description}
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface GameRowProps {
	game: Achievement["game"];
	achievements: Achievement[];
	formatUnlockedDate: (date: Achievement["unlockedAt"]) => string;
	className?: string;
}

function GameRow({
	game,
	achievements,
	formatUnlockedDate,
	className,
}: GameRowProps) {
	const unlockedCount = achievements.filter((a) => a.unlocked).length;
	const gameProgress = (unlockedCount / achievements.length) * 100;

	return (
		<div className={cn("space-y-4", className)}>
			{/* Game Header */}
			<Card>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<img
								src={game.gameIcon ?? undefined}
								alt={game.gameName}
								className="h-12 w-12 rounded-lg object-cover sm:h-16 sm:w-16"
							/>
							<div>
								<CardTitle className="text-lg sm:text-xl">
									{game.gameName}
								</CardTitle>
								<div className="mt-1 flex items-center gap-3">
									<Badge variant="secondary" className="text-sm">
										{unlockedCount}/{achievements.length} unlocked
									</Badge>
									<span className="text-muted-foreground text-sm">
										{Math.round(gameProgress)}% complete
									</span>
								</div>
							</div>
						</div>
					</div>
					<Progress value={gameProgress} className="h-3" />
				</CardHeader>
			</Card>

			{/* Achievements Carousel */}
			<div className="relative">
				<Carousel
					className="w-full"
					opts={{
						align: "start",
						containScroll: "trimSnaps",
					}}
				>
					<CarouselContent className="ml-0 gap-4">
						{achievements.map((achievement) => (
							<CarouselItem key={achievement.id} className="basis-72 pl-0">
								<AchievementItem
									achievement={achievement}
									formatUnlockedDate={formatUnlockedDate}
								/>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious className="left-2" />
					<CarouselNext className="right-2" />
				</Carousel>
			</div>
		</div>
	);
}

interface EmptyStateProps {
	className?: string;
}

function EmptyState({ className }: EmptyStateProps) {
	return (
		<Card className={cn("py-8 text-center sm:py-12", className)}>
			<CardContent>
				<Trophy className="mx-auto mb-4 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
				<h3 className="mb-2 font-semibold text-base sm:text-lg">
					No Achievements Yet
				</h3>
				<p className="text-muted-foreground text-sm">
					Start playing games to unlock achievements and track your progress!
				</p>
			</CardContent>
		</Card>
	);
}

function RouteComponent() {
	const { data, isPending, isError } = trpc.achievements.getAll.useQuery();

	if (isError || isPending) return null;

	// Group achievements by game
	const gameGroups =
		data?.reduce(
			(acc, achievement) => {
				const gameId = achievement.game.gameId;
				if (!acc[gameId]) {
					acc[gameId] = {
						game: achievement.game,
						achievements: [],
					};
				}
				acc[gameId].achievements.push(achievement);
				return acc;
			},
			{} as Record<
				string,
				{ game: Achievement["game"]; achievements: Achievement[] }
			>,
		) || {};

	const formatUnlockedDate = (unlockedAt: Achievement["unlockedAt"]) => {
		try {
			const date = new Date(unlockedAt);
			return format(date, "MMM dd, yyyy 'at' h:mm a");
		} catch {
			return "Unknown date";
		}
	};

	// Calculate overall stats
	const totalAchievements = data?.length || 0;
	const unlockedAchievements = data?.filter((a) => a.unlocked).length || 0;
	const overallProgress =
		totalAchievements > 0
			? (unlockedAchievements / totalAchievements) * 100
			: 0;

	// Recent achievements
	const recentAchievements =
		data
			?.filter((a) => a.unlocked)
			.sort(
				(a, b) =>
					new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime(),
			)
			.slice(0, 3) || [];

	return (
		<MainContainer id="profile-screen" className="w-full overflow-x-hidden">
			<div className="max-w-full space-y-8 p-4 sm:p-6">
				{/* Header Stats */}
				<div className="space-y-6">
					<div className="flex items-center gap-3">
						<Trophy className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
						<div className="min-w-0 flex-1">
							<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
								Achievements
							</h1>
							<p className="text-muted-foreground text-sm sm:text-base">
								Track your gaming accomplishments across all games
							</p>
						</div>
					</div>

					{/* Overall Progress Card */}
					<Card className="border-primary/20 bg-primary/5">
						<CardContent className="p-4 sm:p-6">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
								<StatsCard
									title="Overall Progress"
									value={unlockedAchievements}
									subtitle={`/ ${totalAchievements}`}
									showProgress
									progressValue={overallProgress}
								/>
								<StatsCard
									title="Completion Rate"
									value={`${Math.round(overallProgress)}%`}
								/>
								<StatsCard
									title="Games with Achievements"
									value={Object.keys(gameGroups).length}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Recent Achievements */}
					{recentAchievements.length > 0 && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle
									className={cn("flex items-center gap-2 text-base sm:text-lg")}
								>
									<CheckCircle2 className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
									Recent Unlocks
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div
									className={cn(
										"grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
									)}
								>
									{recentAchievements.map((achievement) => (
										<RecentAchievement
											key={achievement.id}
											achievement={achievement}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Games and Achievements */}
				<div className="space-y-8">
					{Object.values(gameGroups).map(({ game, achievements }) => (
						<GameRow
							key={game.gameId}
							game={game}
							achievements={achievements}
							formatUnlockedDate={formatUnlockedDate}
						/>
					))}
				</div>

				{/* Empty State */}
				{Object.keys(gameGroups).length === 0 && <EmptyState />}
			</div>
		</MainContainer>
	);
}
