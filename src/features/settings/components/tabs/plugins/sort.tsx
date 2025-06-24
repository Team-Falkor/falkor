import { ArrowDownAZ, ArrowUpAZ, Check, Columns2, Rows3 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePluginsProviders } from "@/features/plugins/providers/hooks/usePluginsProviders";
import { useLanguageContext } from "@/i18n/I18N";

export type SortBy = "alphabetic-asc" | "alphabetic-desc";

interface PluginsSortProps {
	showRows: boolean;
	setShowRows: (showRows: boolean) => void;
	sortBy: SortBy;
	setSortBy: Dispatch<SetStateAction<SortBy>>;
}

const PluginsSort = ({
	setShowRows,
	showRows,
	setSortBy,
	sortBy,
}: PluginsSortProps) => {
	const { t } = useLanguageContext();
	const { enabledOnly, changeEnabledOnly } = usePluginsProviders();

	const handleSortToggle = () => {
		const newSortBy =
			sortBy === "alphabetic-asc" ? "alphabetic-desc" : "alphabetic-asc";
		localStorage.setItem("sortBy", newSortBy);
		setSortBy(newSortBy);
	};

	const handleViewToggle = () => {
		const newShowRows = !showRows;
		localStorage.setItem("showRows", String(newShowRows));
		setShowRows(newShowRows);
	};

	return (
		<div className="flex gap-1 md:gap-2">
			{/* Enabled Only Toggle */}
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={enabledOnly ? "default" : "ghost"}
						size="icon"
						onClick={changeEnabledOnly}
						className="h-8 w-8"
						aria-label={enabledOnly ? t("all_plugins") : t("enabled_only")}
					>
						<Check className="h-4 w-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent className="capitalize">
					{enabledOnly ? t("enabled_only") : t("all_plugins")}
				</TooltipContent>
			</Tooltip>

			{/* Sort Toggle */}
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleSortToggle}
						className="h-8 w-8"
						aria-label={
							sortBy === "alphabetic-asc"
								? t("sort_alphabeticly_desc")
								: t("sort_alphabeticly_asc")
						}
					>
						{sortBy === "alphabetic-asc" ? (
							<ArrowUpAZ className="h-4 w-4" />
						) : (
							<ArrowDownAZ className="h-4 w-4" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{sortBy === "alphabetic-asc"
						? t("sort_alphabeticly_asc")
						: t("sort_alphabeticly_desc")}
				</TooltipContent>
			</Tooltip>

			{/* View Toggle */}
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleViewToggle}
						className="h-8 w-8"
						aria-label={showRows ? t("show_grid") : t("show_list")}
					>
						{showRows ? (
							<Columns2 className="h-4 w-4" />
						) : (
							<Rows3 className="h-4 w-4" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{showRows ? t("show_list") : t("show_grid")}
				</TooltipContent>
			</Tooltip>
		</div>
	);
};

export default PluginsSort;
