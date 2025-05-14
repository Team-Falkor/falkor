import { Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguageContext } from "@/i18n/I18N";
import AddPluginModal from "./addPluginModal";

interface PluginAddButtonProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}

const PluginAddButton = ({ open, setOpen }: PluginAddButtonProps) => {
	const { t } = useLanguageContext();

	return (
		<>
			{/* Desktop Add Button (Text + Icon) */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="hidden md:flex md:gap-2"
								onClick={() => {
									setOpen(true);
								}}
							>
								<Plus className="h-4 w-4" />
								<span>{t("install_plugin")}</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t("install_plugin")}</TooltipContent>
					</Tooltip>
				</DialogTrigger>
				<AddPluginModal setOpen={setOpen} open={open} />
			</Dialog>
		</>
	);
};

export default PluginAddButton;
