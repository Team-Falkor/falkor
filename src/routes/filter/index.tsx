import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { FilterSidebar } from "@/features/filter/components/filter-sidebar";
import { GameGrid } from "@/features/filter/components/game-grid";
import { trpc } from "@/lib/trpc";

const filterSearchSchema = z.object({
	limit: z.number().int().positive().optional().default(50),
	offset: z.number().int().min(0).optional().default(0),
	sort: z.string().optional(),
	platforms: z.array(z.number().int().positive()).optional(),
	genreIds: z.array(z.number().int().positive()).optional(), // Corrected name and type
	themes: z.array(z.number().int().positive()).optional(),
	gameModes: z.array(z.number().int().positive()).optional(),
	playerPerspectiveIds: z.array(z.number().int().positive()).optional(),
	minRating: z.number().min(0).max(100).optional(),
	maxRating: z.number().min(0).max(100).optional(),
	minRatingCount: z.number().int().min(0).optional(),
	releaseDateFrom: z.number().int().positive().optional(),
	releaseDateTo: z.number().int().positive().optional(),
	minHypes: z.number().int().min(0).optional(),
	onlyMainGames: z.boolean().optional(),
	excludeVersions: z.boolean().optional(),
});

export const Route = createFileRoute("/filter/")({
	component: RouteComponent,
	validateSearch: zodValidator(filterSearchSchema),
});

function RouteComponent() {
	const search = Route.useSearch();

	const { data, isLoading } = trpc.igdb.filter.useQuery(search);

	return (
		<div className="flex flex-col lg:flex-row">
			{/* Sidebar */}
			<aside className="w-full p-4 lg:w-[27%] xl:w-[22%]">
				<FilterSidebar initialFilters={search} />
			</aside>

			{/* Main content */}
			<main className="w-full p-4 lg:w-3/4 xl:w-4/5">
				<GameGrid games={data} isLoading={isLoading} />
			</main>
		</div>
	);
}
