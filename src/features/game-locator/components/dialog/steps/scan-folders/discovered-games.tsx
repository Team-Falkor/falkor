import type { FC } from "react";
import type { FileInfo } from "@/@types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { P, TypographyMuted } from "@/components/ui/typography";

interface DiscoveredGamesProps {
	games: FileInfo[];
	isScanning: boolean;
}

export const DiscoveredGames: FC<DiscoveredGamesProps> = ({
	games,
	isScanning,
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Discovered Games</CardTitle>
			</CardHeader>
			<CardContent>
				{games.length === 0 ? (
					<div className="py-8 text-center">
						<TypographyMuted>
							{isScanning ? "Scanning for games..." : "No games found yet"}
						</TypographyMuted>
					</div>
				) : (
					<ScrollArea className="h-64">
						<div className="space-y-2 pr-4">
							{games.map((game, gameIndex) => (
								<div key={game.path}>
									<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-muted/50 p-3 transition-colors hover:bg-muted">
										<div className="overflow-hidden">
											<P className="truncate font-medium">{game.name}</P>
											<TypographyMuted className="truncate text-xs">
												{game.path}
											</TypographyMuted>
										</div>

										{game.size && (
											<div>
												<TypographyMuted className="whitespace-nowrap text-xs">
													{(game.size / (1024 * 1024)).toFixed(1)} MB
												</TypographyMuted>
											</div>
										)}
									</div>
									{gameIndex < games.length - 1 && (
										<Separator className="mt-2" />
									)}
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
};
