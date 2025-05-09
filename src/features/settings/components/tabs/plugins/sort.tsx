import { ArrowDownAZ, ArrowUpAZ, Check, Columns2, Rows3 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguageContext } from "@/i18n/I18N";

export type SortBy = "alphabetic-asc" | "alphabetic-desc";

interface PluginsSortProps {
	showRows: boolean;
	setShowRows: (showRows: boolean) => void;
	sortBy: SortBy;
	setSortBy: Dispatch<SetStateAction<SortBy>>;

	setShowEnabledOnly: Dispatch<SetStateAction<boolean>>;
	showEnabledOnly: boolean;
}

const PluginsSort = ({
	setShowRows,
	showRows,
	setSortBy,
	sortBy,
	setShowEnabledOnly,
	showEnabledOnly,
}: PluginsSortProps) => {
	const { t } = useLanguageContext();

	return (
		<div className="flex gap-1 md:gap-2">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={showEnabledOnly ? "default" : "ghost"}
						size={"icon"}
						onClick={() => {
							localStorage.setItem("showEnabledOnly", String(!showEnabledOnly));
							setShowEnabledOnly(!showEnabledOnly);
						}}
						className="h-8 w-8"
					>
						<Check className="h-4 w-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent className="capitalize">
					{!showEnabledOnly ? t("enabled_only") : t("all_plugins")}
				</TooltipContent>
			</Tooltip>

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={"ghost"}
						size={"icon"}
						onClick={() => {
							const newSortBy =
								sortBy === "alphabetic-asc"
									? "alphabetic-desc"
									: "alphabetic-asc";
							localStorage.setItem("sortBy", newSortBy);
							setSortBy(newSortBy);
						}}
						className="h-8 w-8"
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

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={"ghost"}
						size={"icon"}
						onClick={() => {
							localStorage.setItem("showRows", String(!showRows));
							setShowRows(!showRows);
						}}
						className="h-8 w-8"
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
