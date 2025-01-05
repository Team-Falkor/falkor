import { Tab } from "@/@types";
import { H5 } from "@/components/typography/h5";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NewListDialogContent from "@/features/lists/components/newListDialogContent";
import useGamepadButton from "@/hooks/useGamepadButton";
import { cn } from "@/lib";
import { Plus } from "lucide-react";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import NewGameModal from "../modals/newGame";

interface LibraryTabsProps {
  tabs: Array<Tab>;
  activeTab: Tab | undefined;
  setActiveTab: Dispatch<SetStateAction<Tab | undefined>>;
}

const LibraryTabs = ({ tabs, activeTab, setActiveTab }: LibraryTabsProps) => {
  const [newListOpen, setNewListOpen] = useState(false);
  const [newGameOpen, setNewGameOpen] = useState(false);

  const activeTabIndex = useMemo(
    () => tabs.findIndex((tab) => tab.name === activeTab?.name),
    [tabs, activeTab]
  );

  const switchToNextTab = useCallback(() => {
    if (!tabs.length) return;
    if (newGameOpen || newListOpen) return;

    // if last tab is active, open new list modal
    if (activeTabIndex === 0) {
      setNewGameOpen(true);
      return;
    }

    const nextIndex = (activeTabIndex + 1) % tabs.length;

    setActiveTab(tabs[nextIndex]);
  }, [tabs, newGameOpen, newListOpen, activeTabIndex, setActiveTab]);

  const switchToPreviousTab = useCallback(() => {
    if (!tabs.length) return;
    if (newGameOpen || newListOpen) return;

    const previousIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;

    // if first tab is active, open new game modal
    if (activeTabIndex === tabs.length - 1) {
      setNewListOpen(true);
      return;
    }

    setActiveTab(tabs[previousIndex]);
  }, [tabs, newGameOpen, newListOpen, activeTabIndex, setActiveTab]);

  useGamepadButton("LB", switchToNextTab);
  useGamepadButton("RB", switchToPreviousTab);
  useGamepadButton(
    "LS",
    useCallback(() => {
      if (newGameOpen || newListOpen) return;
      setNewGameOpen(true);
    }, [newGameOpen, newListOpen])
  );
  useGamepadButton(
    "RS",
    useCallback(() => {
      if (newGameOpen || newListOpen) return;
      setNewListOpen(true);
    }, [newGameOpen, newListOpen])
  );

  return (
    <div className="flex p-4 bg-background">
      {/* New Game Button */}
      <Dialog open={newGameOpen} onOpenChange={setNewGameOpen}>
        <DialogTrigger>
          <Button className="text-white bg-gradient-to-tr from-blue-400 to-purple-400 gap-1.5 rounded-full hover:opacity-90 transition-all">
            <Plus strokeWidth={3} />
            <H5>New Game</H5>
          </Button>
        </DialogTrigger>
        <NewGameModal />
      </Dialog>

      {/* Tabs */}
      <Carousel
        className="flex-1 mx-3"
        opts={{
          skipSnaps: true,
          dragFree: true,
          loop: false,
        }}
      >
        <CarouselContent>
          {tabs.map((tab, i) => (
            <CarouselItem key={i} className="basis-auto ">
              <Button
                variant={activeTab?.name === tab.name ? "active" : "default"}
                key={i}
                className={cn(
                  "gap-1.5 font-semibold transition-all duration-75 rounded-full"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab.name}
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* New List Button */}
      <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
        <DialogTrigger>
          <Button className="rounded-full gap-1.5 ml-1">
            <Plus strokeWidth={3} />
            <H5>New List</H5>
          </Button>
        </DialogTrigger>
        <NewListDialogContent open={newListOpen} setOpen={setNewListOpen} />
      </Dialog>
    </div>
  );
};

export default LibraryTabs;
