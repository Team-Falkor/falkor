import { Loader2, RefreshCcw } from "lucide-react";
import type { RouterInputs } from "@/@types";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TypographyMuted } from "@/components/ui/typography";
import { useLanguageContext } from "@/i18n/I18N";

type ProtonVariant = RouterInputs["proton"]["getVersionsForVariant"]["variant"];

interface ProtonControlsProps {
	selectedVariant: ProtonVariant;
	onVariantChange: (variant: ProtonVariant) => void;
	onRefresh: () => void;
	isLoading: boolean;
	isRefreshing: boolean;
}

export const ProtonControls = ({
	selectedVariant,
	onVariantChange,
	onRefresh,
	isLoading,
	isRefreshing,
}: ProtonControlsProps) => {
	const { t } = useLanguageContext();

	return (
		<div className="flex flex-shrink-0 items-center gap-4">
			<div className="flex items-center gap-2">
				<TypographyMuted>{t("proton.variant")}</TypographyMuted>
				<Select
					value={selectedVariant}
					onValueChange={onVariantChange}
				>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="proton-ge">Proton-GE</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Button
				variant="outline"
				onClick={onRefresh}
				disabled={isLoading || isRefreshing}
			>
				{isLoading || isRefreshing ? (
					<Loader2 className="animate-spin" />
				) : (
					<RefreshCcw />
				)}
			</Button>
		</div>
	);
};