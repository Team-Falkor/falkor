import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, User, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguageContext } from "@/i18n/I18N";

type CategoryType = "theme" | "genre" | "game_mode";

type Category = {
	titleKey: string;
	icon: string | ReactNode;
	id: string;
	type: CategoryType;
};

const categories: Category[] = [
	{ titleKey: "categories.action", icon: "🎮", id: "1", type: "theme" },
	{ titleKey: "categories.adventure", icon: "🗺️", id: "31", type: "genre" },
	{ titleKey: "categories.rpg", icon: "⚔️", id: "12", type: "genre" },
	{ titleKey: "categories.strategy", icon: "🧠", id: "15", type: "genre" },
	{
		titleKey: "categories.coop",
		icon: <Users className="h-4 w-4" />,
		id: "3",
		type: "game_mode",
	},
	{
		titleKey: "categories.horror",
		icon: "👻",
		id: "19",
		type: "theme",
	},
	{
		titleKey: "categories.singleplayer",
		icon: <User className="h-4 w-4" />,
		id: "1",
		type: "game_mode",
	},
	{ titleKey: "categories.simulation", icon: "🏗️", id: "13", type: "genre" },
];

const GameCategories = () => {
	const { t } = useLanguageContext();

	return (
		<div className="mb-16">
			<div className="mb-6">
				<h2 className="mb-2 font-semibold text-foreground text-xl">
					{t("browse_by_category")}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t("discover_games_by_genres_themes")}
				</p>
			</div>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
				{categories.map((category) => {
					const searchParams = (() => {
						switch (category.type) {
							case "theme":
								return { themes: [Number(category.id)] };
							case "genre":
								return { genreIds: [Number(category.id)] };
							case "game_mode":
								return { gameModes: [Number(category.id)] };
							default:
								return {};
						}
					})();

					return (
						<Card
							key={category.titleKey}
							className="group relative h-24 overflow-hidden bg-card transition-all duration-200 focus-states:scale-[1.02] focus-states:shadow-lg"
						>
							<CardContent className="h-full p-0">
								<Link
									to="/filter"
									search={searchParams}
									className="flex h-full w-full items-center justify-center p-4 focus:outline-none"
								>
									<div className="flex flex-col items-center space-y-2 text-center">
										<div className="flex h-8 w-8 items-center justify-center text-lg transition-transform group-focus-states:scale-110">
											{typeof category.icon === "string"
												? category.icon
												: category.icon}
										</div>
										<span className="font-medium text-foreground text-xs leading-tight">
											{t(category.titleKey)}
										</span>
									</div>
									<div className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-focus-states:opacity-100">
										<ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
									</div>
								</Link>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
};

export default GameCategories;
