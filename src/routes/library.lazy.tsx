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
import useGamepadButton from "@/hooks/use-gamepad-button";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib";

export const Route = createLazyFileRoute("/library")({
	component: Library,
});

function Library() {
	const { t } = useLanguageContext();
	const { lists } = useLists();

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

	const [newListOpen, setNewListOpen] = useState(false);
	const [newGameOpen, setNewGameOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab | undefined>(undefined);

	useEffect(() => {
		if (tabs.length === 0) {
			if (activeTab !== undefined) {
				setActiveTab(undefined);
			}
			return;
		}

		let targetTab: Tab | undefined;
		const currentActiveTabName = activeTab?.name;

		if (currentActiveTabName) {
			targetTab = tabs.find((tab) => tab.name === currentActiveTabName);
		}

		if (!targetTab) {
			targetTab = tabs[0];
		}

		if (activeTab !== targetTab) {
			setActiveTab(targetTab);
		}
	}, [tabs, activeTab]);

	const activeTabIndex = useMemo(() => {
		if (!activeTab || tabs.length === 0) return -1;
		return tabs.findIndex((tab) => tab.name === activeTab.name);
	}, [tabs, activeTab]);

	const switchToNextTab = () => {
		if (
			tabs.length === 0 ||
			newGameOpen ||
			newListOpen ||
			activeTabIndex === -1
		) {
			return;
		}

		if (activeTabIndex === tabs.length - 1) {
			setNewListOpen(true);
		} else {
			setActiveTab(tabs[activeTabIndex + 1]);
		}
	};

	const switchToPreviousTab = () => {
		if (
			tabs.length === 0 ||
			newGameOpen ||
			newListOpen ||
			activeTabIndex === -1
		) {
			return;
		}

		if (activeTabIndex === 0) {
			setNewGameOpen(true);
		} else {
			setActiveTab(tabs[activeTabIndex - 1]);
		}
	};

	useGamepadButton("LB", switchToPreviousTab);
	useGamepadButton("RB", switchToNextTab);
	useGamepadButton("LS", () => {
		if (newGameOpen || newListOpen) return;
		setNewGameOpen(true);
	});
	useGamepadButton("RS", () => {
		if (newGameOpen || newListOpen) return;
		setNewListOpen(true);
	});

	return (
		<div className="w-full p-0 py-0">
			<div className="flex justify-between bg-background p-4">
				<NewGameModal open={newGameOpen} setOpen={setNewGameOpen} />
				<Carousel
					className="mx-3 flex-1"
					opts={{
						skipSnaps: true,
						dragFree: true,
						loop: false,
						align: "start",
					}}
				>
					<CarouselContent>
						{tabs.map((tab) => (
							<CarouselItem key={tab.name} className="basis-auto">
								<Button
									variant={activeTab?.name === tab.name ? "active" : "default"}
									className={cn(
										"gap-1.5 rounded-full font-semibold transition-all duration-75",
									)}
									onClick={() => {
										if (!newGameOpen && !newListOpen) {
											setActiveTab(tab);
										}
									}}
								>
									{tab.name}
								</Button>
							</CarouselItem>
						))}
					</CarouselContent>
				</Carousel>
				<NewListDialog open={newListOpen} setOpen={setNewListOpen}>
					<NewListButton onClick={() => setNewListOpen(true)} />
				</NewListDialog>
			</div>
			<div className="mt-4">{activeTab?.component}</div>
		</div>
	);
}
