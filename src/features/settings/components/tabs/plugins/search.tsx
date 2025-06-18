import { SearchIcon } from "lucide-react";
import { useRef } from "react";
import { InputWithIcon } from "@/components/inputWithIcon";
import { useLanguageContext } from "@/i18n/I18N";

interface PluginSearchProps {
	search: string;
	setSearch: (search: string) => void;
}

const PluginSearch = ({ search, setSearch }: PluginSearchProps) => {
	const { t } = useLanguageContext();
	const searchInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="relative flex-grow">
			<InputWithIcon
				ref={searchInputRef}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder={t("what_plugin_are_you_looking_for")}
				startIcon={<SearchIcon />}
				className="w-full"
			/>
		</div>
	);
};

export default PluginSearch;
