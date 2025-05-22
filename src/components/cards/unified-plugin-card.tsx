import type { PluginSetupJSONAuthor } from "@team-falkor/shared-types";
import { Download, Power, PowerOff, Trash2, UserIcon } from "lucide-react";
import { type SyntheticEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { usePluginsProviders } from "@/features/plugins/providers/hooks/usePluginsProviders";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib";

interface UnifiedPluginCardProps {
	// Common props
	id: string;
	name: string;
	description: string;
	version: string;
	image: string;
	banner?: string;
	author?: PluginSetupJSONAuthor;

	// Plugin specific props
	isInstalled?: boolean;
	disabled?: boolean;
	needsUpdate?: boolean;

	// Provider specific props
	setupUrl?: string;
}

const UnifiedPluginCard = ({
	id,
	name,
	description,
	version,
	image,
	author,
	isInstalled = false,
	disabled = false,
	needsUpdate = false,
	setupUrl,
}: UnifiedPluginCardProps) => {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);
	const {
		disablePlugin,
		enablePlugin,
		deletePlugin,
		updatePlugin,
		installPlugin,
	} = usePluginsProviders();
	const { t } = useLanguageContext();

	// get 4 letters from name after space or use the min number of words if below 4
	const words = useMemo(() => name.split(" "), [name]);
	const logo = useMemo(
		() => (words.length > 4 ? words[0][0] + words[1][0] : words[0]),
		[words],
	);

	const handleInstall = async () => {
		if (!setupUrl) return;

		try {
			await installPlugin(setupUrl);
			toast.success("Plugin installed");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to install plugin",
			);
		}
	};

	const handleImageLoad = () => {
		setImageLoaded(true);
		setImageError(false);
	};

	const handlePlaceholder = (e: SyntheticEvent<HTMLImageElement, Event>) => {
		setImageError(true);
		e.currentTarget.src = `https://placehold.co/96x96?text=${encodeURIComponent(logo)}`;
	};

	return (
		<Card className="group relative h-full overflow-hidden transition-all duration-200 focus-states:scale-[1.01] focus-states:shadow-lg">
			<CardHeader className="items-center justify-center space-y-4 text-center">
				<div className="flex w-full justify-center">
					<div className="relative h-24 w-24 overflow-hidden rounded-lg bg-muted/20">
						<img
							src={
								imageError
									? `https://placehold.co/96x96?text=${encodeURIComponent(logo)}`
									: image
							}
							alt={name}
							className={cn(
								"h-full w-full object-cover transition-all duration-200",
								{
									"opacity-0": !imageLoaded && !imageError,
									"group-focus-states:scale-110": imageLoaded && !imageError,
								},
							)}
							onError={handlePlaceholder}
							onLoad={handleImageLoad}
							loading="lazy"
						/>
						{!imageLoaded && !imageError && (
							<div className="absolute inset-0 flex items-center justify-center bg-muted/20">
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							</div>
						)}
					</div>
				</div>
				<div className="space-y-1.5">
					<CardTitle className="font-semibold text-xl transition-colors duration-200 group-focus-states:text-primary">
						{name}
					</CardTitle>
					<CardDescription className="flex items-center justify-center gap-2 text-sm">
						{needsUpdate && (
							<span className="font-bold text-red-500">[Update available]</span>
						)}
						{id} - V{version}
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent>
				<p className="line-clamp-3 w-full text-pretty text-center text-muted-foreground text-sm">
					{description}
				</p>
			</CardContent>

			<CardFooter className="mt-auto w-full">
				<div className="flex w-full items-center justify-between gap-4">
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						{author && (
							<a
								href={author.url}
								className={cn(
									"group/author flex items-center gap-1.5 text-muted-foreground transition-colors duration-200 focus-states:text-primary",
									{ "cursor-pointer": author.url },
								)}
							>
								<UserIcon className="size-4 flex-shrink-0" />
								<span className="truncate text-sm group-hover/author:underline">
									{author.name}
								</span>
							</a>
						)}
					</div>
					<div className="flex items-center gap-2">
						{isInstalled ? (
							<>
								{needsUpdate && (
									<Button
										onClick={() => updatePlugin(id)}
										size="sm"
										className="transition-all duration-200 hover:scale-105"
									>
										<Download className="mr-2" />
										{t("update")}
									</Button>
								)}
								<Button
									variant="destructive"
									onClick={() => deletePlugin(id)}
									size="sm"
									className="capitalize transition-all duration-200 hover:scale-105"
								>
									<Trash2 />
								</Button>
								{disabled ? (
									<Button
										variant="success"
										onClick={() => enablePlugin(id)}
										size="sm"
										className="capitalize transition-all duration-200 hover:scale-105"
									>
										<Power />
									</Button>
								) : (
									<Button
										variant="destructive"
										onClick={() => disablePlugin(id)}
										size="sm"
										className="transition-all duration-200 hover:scale-105"
									>
										<PowerOff />
									</Button>
								)}
							</>
						) : (
							<Button
								onClick={handleInstall}
								size="sm"
								className="transition-all duration-200 hover:scale-105"
							>
								<Download />
							</Button>
						)}
					</div>
				</div>
			</CardFooter>
		</Card>
	);
};

export default UnifiedPluginCard;
