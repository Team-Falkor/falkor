import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Tab } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import ActiveLibrary from "@/features/library/components/active-library";
import { NewGameModal } from "@/features/library/components/modals/new-game";
import { NewListButton } from "@/features/library/components/new-list-button";
import { NewListDialog } from "@/features/lists/components/new-list-dialog";
import { useLists } from "@/features/lists/hooks/use-lists";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib";

export const Route = createLazyFileRoute("/library")({
	component: Library,
});

function Library() {
	const { t } = useLanguageContext();
	const { lists } = useLists();
	const [open, setOpen] = useState(false);

	// const [activeTab, setActiveTab] = useState<Tab | undefined>(tabs[0]);

	const tabs = useMemo((): Array<Tab> => {
		const listTabs: Array<Tab> =
			lists?.map((list) => ({
				name: list.name,
				component: (
					<ActiveLibrary
						type="list"
						listId={list.id}
						description={list.description ?? undefined}
						title={list.name}
						key={list.id}
					/>
				),
			})) ?? [];

		return [
			{
				name: t("sections.continue_playing"),
				component: (
					<ActiveLibrary type="game" title={t("sections.continue_playing")} />
				),
			},
			...listTabs,
		];
	}, [lists, t]);

	// Only set activeTab after tabs is ready to avoid undefined issues.
	const [activeTab, setActiveTab] = useState<Tab | undefined>(tabs[0]);

	useEffect(() => {
		if (tabs.length > 0 && !activeTab) setActiveTab(tabs[0]);

		if (!tabs.find((tab) => tab.name === activeTab?.name)) {
			setActiveTab(tabs[0]);
		}
	}, [tabs, activeTab]);

	return (
		<div className="w-full p-0 py-0">
			{/* Top Navigation Bar */}
			<div className="flex justify-between bg-background p-4">
				{/* New Game Button */}
				<NewGameModal />

				{/* Tabs */}
				<Carousel
					className="mx-3 flex-1"
					opts={{
						skipSnaps: true,
						dragFree: true,
						loop: false,
					}}
				>
					<CarouselContent>
						{tabs.map((tab, i) => (
							<CarouselItem key={tab.name} className="basis-auto">
								<Button
									variant={activeTab?.name === tab.name ? "active" : "default"}
									className={cn(
										"gap-1.5 rounded-full font-semibold transition-all duration-75",
									)}
									onClick={() => setActiveTab(tab)}
								>
									{tab.name}
								</Button>
							</CarouselItem>
						))}
					</CarouselContent>
				</Carousel>

				{/* New Lists Button */}
				<NewListDialog open={open} setOpen={setOpen}>
					<NewListButton onClick={() => setOpen(true)} />
				</NewListDialog>
			</div>
			<div className="mt-4">{activeTab?.component}</div>
		</div>
	);
}
