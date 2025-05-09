import { Plus } from "lucide-react";
import UnifiedPluginCard from "@/components/cards/unified-plugin-card";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib";

export function CommunityProviders() {
	const {
		error,
		isLoading,
		data: providers,
	} = trpc.plugins.community.getProviders.useQuery();

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Card
						key={i}
						className="bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60"
					>
						<CardHeader>
							<div className="h-7 w-3/4 animate-pulse rounded bg-gray-700" />
							<div className="h-4 w-1/2 animate-pulse rounded bg-gray-700" />
						</CardHeader>
						<CardContent>
							<div className="mb-2 h-4 w-full animate-pulse rounded bg-gray-700" />
							<div className="h-4 w-2/3 animate-pulse rounded bg-gray-700" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<Card className="bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<CardHeader>
					<CardTitle className="text-red-500">Error</CardTitle>
					<CardDescription>Failed to load providers</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="mb-4 text-gray-300">
						There was an error loading the providers. Please try again later.
					</p>
					<Button onClick={() => window.location.reload()}>Retry</Button>
				</CardContent>
			</Card>
		);
	}

	if (!providers?.data?.length) {
		return (
			<Card className="bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<CardHeader>
					<CardTitle>No Community Providers</CardTitle>
					<CardDescription>
						Get started by adding the first community provider.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<a href="https://falkor.moe/plugins/providers/add">
							<Plus />
							Add Provider
						</a>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{providers?.data.map((p) => {
				const setupJSON = JSON.parse(p.setupJSON);
				return (
					<UnifiedPluginCard
						key={p.id}
						id={setupJSON.id}
						name={p.name}
						description={setupJSON.description}
						version={setupJSON.version}
						image={setupJSON.logo}
						author={setupJSON.author}
						setupUrl={p.setupUrl}
					/>
				);
			})}
		</div>
	);
}
