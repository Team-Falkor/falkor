import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { SettingsTitleBarStyle } from "@/@types";
import { ButtonWithIcon } from "@/components/buttonWithIcon";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { cn } from "@/lib";

const TitleBarDropdown = () => {
	const { settings, updateSetting } = useSettings();
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<ButtonWithIcon
					endIcon={
						<ChevronDown
							className={cn("w-full overflow-hidden truncate transition-all", {
								"rotate-180": open,
								"rotate-0": !open,
							})}
						/>
					}
				>
					{settings?.titleBarStyle}
				</ButtonWithIcon>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-64" side="bottom">
				<DropdownMenuLabel>Title Bar Style</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup
					value={settings?.titleBarStyle}
					onValueChange={(value) =>
						updateSetting({
							path: "titleBarStyle",
							value: value as SettingsTitleBarStyle,
						})
					}
				>
					<DropdownMenuRadioItem value="native">Native</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="icons">Icons</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="traffic-lights">
						Traffic Lights
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default TitleBarDropdown;
