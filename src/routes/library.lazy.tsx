import { createLazyFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { Tab } from "@/@types";
import GameLoader from "@/components/spinner";
import { NewGameButton } from "@/features/library/components/new-game";
import { NewListButton } from "@/features/library/components/new-list-button";
import { TabCarousel } from "@/features/library/components/TabCarousel";
import { NewListDialog } from "@/features/lists/components/new-list-dialog";
import { useLists } from "@/features/lists/hooks/use-lists";
import useGamepadButton from "@/hooks/use-gamepad-button";
import { useLanguageContext } from "@/i18n/I18N";

const ActiveLibrary = lazy(
	() => import("@/features/library/components/active-library"),
);
const NewGameDialog = lazy(() =>
	import("@/features/library/components/modals/new-game").then((module) => ({
		default: module.NewGameDialog,
	})),
);

export const Route = createLazyFileRoute("/library")({
	component: LibraryPage,
});

function LoadingSpinner() {
	return (
		<div className="flex h-[90svh] w-full items-center justify-center">
			<GameLoader />
		</div>
	);
}

function LibraryPage() {
	const { t } = useLanguageContext();
	const { lists } = useLists();

	const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
	const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab | undefined>(undefined);

	const generatedTabs = useMemo((): Array<Tab> => {
		const listDerivedTabs: Array<Tab> =
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
					<ActiveLibrary
						type="game"
						title={t("sections.continue_playing")}
						description={t("continue_playing_description")}
					/>
				),
			},
			...listDerivedTabs,
		];
	}, [lists, t]);

	useEffect(() => {
		if (generatedTabs.length === 0) {
			if (activeTab !== undefined) {
				setActiveTab(undefined);
			}
			return;
		}
		let newTargetTab: Tab | undefined;
		if (activeTab?.name) {
			newTargetTab = generatedTabs.find((t) => t.name === activeTab.name);
		}
		if (!newTargetTab) {
			newTargetTab = generatedTabs[0];
		}
		if (newTargetTab && activeTab !== newTargetTab) {
			setActiveTab(newTargetTab);
		}
	}, [generatedTabs, activeTab]);

	const activeTabIndex = useMemo(() => {
		if (!activeTab || generatedTabs.length === 0) return -1;
		return generatedTabs.findIndex((tab) => tab.name === activeTab.name);
	}, [generatedTabs, activeTab]);

	const isModalOpen = isNewGameModalOpen || isNewListModalOpen;

	const switchToNextTab = () => {
		if (isModalOpen || generatedTabs.length === 0 || activeTabIndex === -1) {
			return;
		}
		if (activeTabIndex === generatedTabs.length - 1) {
			setIsNewListModalOpen(true);
		} else {
			setActiveTab(generatedTabs[activeTabIndex + 1]);
		}
	};

	const switchToPreviousTab = () => {
		if (isModalOpen || generatedTabs.length === 0 || activeTabIndex === -1) {
			return;
		}
		if (activeTabIndex === 0) {
			setIsNewGameModalOpen(true);
		} else {
			setActiveTab(generatedTabs[activeTabIndex - 1]);
		}
	};

	useGamepadButton("LB", switchToPreviousTab);
	useGamepadButton("RB", switchToNextTab);
	useGamepadButton("LS", () => {
		if (isModalOpen) return;
		setIsNewGameModalOpen(true);
	});
	useGamepadButton("RS", () => {
		if (isModalOpen) return;
		setIsNewListModalOpen(true);
	});

	return (
		<div className="w-full p-0 py-0">
			<div className="flex justify-between bg-background p-4">
				<Suspense fallback={<NewGameButton disabled={true} />}>
					<NewGameDialog
						open={isNewGameModalOpen}
						setOpen={setIsNewGameModalOpen}
					/>
				</Suspense>

				<TabCarousel
					tabs={generatedTabs}
					activeTabName={activeTab?.name}
					onTabSelect={setActiveTab}
					disabled={isModalOpen}
				/>

				<Suspense fallback={<NewListButton disabled={true} />}>
					<NewListDialog
						open={isNewListModalOpen}
						setOpen={setIsNewListModalOpen}
					>
						<NewListButton onClick={() => setIsNewListModalOpen(true)} />
					</NewListDialog>
				</Suspense>
			</div>

			<div className="mt-4">
				<Suspense fallback={<LoadingSpinner />}>
					{activeTab?.component}
				</Suspense>
			</div>
		</div>
	);
}
