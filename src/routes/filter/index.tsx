import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { FilterSidebar } from "@/features/filter/components/filter-sidebar";
import { GameGrid } from "@/features/filter/components/game-grid";
import { trpc } from "@/lib/trpc";

const filterSearchSchema = z.object({
	sort: z.string().optional(),
	platforms: z.array(z.number()).optional(),
	themes: z.array(z.number()).optional(),
	minRating: z.number().optional(),
	maxRating: z.number().optional(),
	releaseDateFrom: z.number().optional(),
	releaseDateTo: z.number().optional(),
	excludeVersions: z.boolean().optional(),
	gameModes: z.array(z.number()).optional(),
	genres: z.array(z.string()).optional(),
	limit: z.number().default(50),
	offset: z.number().default(0),
});

export const Route = createFileRoute("/filter/")({
	component: RouteComponent,
	validateSearch: zodValidator(filterSearchSchema),
});

function RouteComponent() {
	const search = Route.useSearch();
	const { data, isLoading } = trpc.igdb.filter.useQuery({
		options: search,
		limit: search.limit,
		offset: search.offset,
	});

	return (
		<div className="flex flex-col lg:flex-row">
			{/* Sidebar */}
			<aside className="w-full p-4 lg:w-1/4 xl:w-1/5">
				<FilterSidebar initialFilters={search} />
			</aside>

			{/* Main content */}
			<main className="w-full p-4 lg:w-3/4 xl:w-4/5">
				<GameGrid games={data} isLoading={isLoading} />
			</main>
		</div>
	);
}
