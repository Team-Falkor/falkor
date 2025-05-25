import type { RouterOutputs } from "@/@types";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type Item = RouterOutputs["downloads"]["getCachingItems"][number];

interface CachingDownloadData extends Item {
	typeOf: "caching";
}

export function CachingDownloadItem(data: CachingDownloadData) {
	return (
		<Card key={data.id}>
			<CardHeader className="pb-2">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<CardTitle className="mr-2 break-words text-lg">
						{decodeURIComponent(data?.title ?? "Untitled Download")}
					</CardTitle>

					<div className="flex flex-shrink-0 space-x-1" />
				</div>
				<CardDescription>Caching</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-muted-foreground text-xs">
						<div className="flex items-center gap-1">
							downloading on debrid server
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
