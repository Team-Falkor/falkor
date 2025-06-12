import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
	{ title: "Action", icon: "🎮", id: "1", type: "theme" },
	{ title: "Adventure", icon: "🗺️", id: "31", type: "genre" },
	{ title: "RPG", icon: "⚔️", id: "12", type: "genre" },
	{ title: "Strategy", icon: "🧠", id: "15", type: "genre" },
] as const;

const GameCategories = () => {
	return (
		<div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{categories.map((category) => (
				<Card
					key={category.title}
					className="group overflow-hidden bg-muted/30 transition-all focus-states:shadow-md focus-states:ring-1 focus-states:ring-primary/20"
				>
					<CardContent className="p-0">
						<Link
							to="/filter"
							search={{
								[category.type === "theme" ? "themes" : "genres"]: [
									category.type === "theme" ? Number(category.id) : category.id,
								],
							}}
							className="block p-6"
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full text-2xl">
										{category.icon}
									</div>
									<div>
										<h3 className="font-medium">{category.title}</h3>
									</div>
								</div>
								<div className="opacity-0 transition-opacity group-focus-states:opacity-100">
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 rounded-full p-0"
									>
										→
									</Button>
								</div>
							</div>
						</Link>
					</CardContent>
				</Card>
			))}
		</div>
	);
};

export default GameCategories;
