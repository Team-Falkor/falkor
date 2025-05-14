import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { ButtonWithIcon } from "@/components/buttonWithIcon";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { useLanguageContext } from "@/i18n/I18N";
import { cn } from "@/lib";

const LanguageDropdown = () => {
	const { languages, i18n } = useLanguageContext();
	const { settings, updateSetting } = useSettings();
	const [open, setOpen] = useState(false);

	const currentLanguage = useMemo(() => {
		if (!settings) return;
		return Object.entries(languages).find(([key, _value]) => {
			if (settings.language) return key === settings.language;
			return key === i18n.language;
		});
	}, [settings, languages, i18n]);

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
					{currentLanguage?.[1].nativeName}
				</ButtonWithIcon>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-64" align="start" side="bottom">
				<DropdownMenuLabel>Choose Language</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{Object.entries(languages).map(([key, value]) => (
					<DropdownMenuCheckboxItem
						key={key}
						checked={currentLanguage?.[0] === key}
						onCheckedChange={() => {
							i18n.changeLanguage(key);
							updateSetting({
								path: "language",
								value: key,
							});
						}}
					>
						{value.nativeName} ({key})
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default LanguageDropdown;
