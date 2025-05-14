import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import type { ReleaseDate } from "@/@types";
import AchievementContainer from "@/features/achievements/components/container";
// TODO: Port over components from old codebase
// import AchievementContainer from "@/features/achievements/components/container";
import { InfoBar } from "@/features/info/info-bar";
import SimilarGames from "@/features/info/similar";
import InfoTop from "@/features/info/top";
import { getSteamIdFromWebsites, trpc } from "@/lib";
import { goBack } from "@/lib/history";

export const Route = createLazyFileRoute("/info/$id")({ component: Info });

function Info() {
	const { id } = Route.useParams();

	const { isPending, error, data } = trpc.igdb.info.useQuery({
		id: id,
	});

	const releaseDate = useMemo(
		() =>
			data
				? (data.release_dates?.find(
						(item: ReleaseDate) => item.platform === 6,
					) ?? data.release_dates?.[0])
				: null,
		[data],
	);

	const isReleased = useMemo(
		() =>
			!releaseDate
				? false
				: !releaseDate?.date || releaseDate.date < Date.now() / 1000,
		[releaseDate],
	);

	const itadQuery = trpc.itad.pricesByName.useQuery(
		{
			name: data?.name ?? "",
		},
		{
			enabled: !!id && isReleased,
		},
	);

	const steam_id = useMemo(
		() => getSteamIdFromWebsites(data?.websites ?? []),
		[data?.websites],
	);

	if (error) return null;

	return (
		<div className="relative h-full w-full max-w-[100vw] overflow-x-hidden pb-20">
			{/* TOP BAR */}
			<InfoBar
				data={data}
				titleText={data?.name ?? ""}
				onBack={() => goBack()}
				isPending={isPending}
			/>
			<div className="mx-auto mt-4 flex flex-col gap-12 overflow-hidden px-5">
				<InfoTop
					data={data}
					isReleased={isReleased}
					error={error}
					isPending={isPending}
					releaseDate={releaseDate}
					steamID={steam_id}
					itadData={itadQuery.data}
					itadError={itadQuery.error?.message}
					itadPending={itadQuery.isPending}
				/>

				{!!steam_id && <AchievementContainer steamId={steam_id} gameId={id} />}

				<SimilarGames data={data?.similar_games ?? []} />
			</div>
		</div>
	);
}
