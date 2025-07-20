import type { ProtonVariant } from "@team-falkor/game-launcher";
import { useEffect, useState } from "react";
import type { Game } from "@/@types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguageContext } from "@/i18n/I18N";
import { trpc } from "@/lib";

interface ProtonConfigurationCardProps {
	game: Partial<Game>;
	onGameChange: (updatedFields: Partial<Game>) => void;
}

export const ProtonConfigurationCard = ({
	game,
	onGameChange,
}: ProtonConfigurationCardProps) => {
	const { t } = useLanguageContext();
	// Local state for UI responsiveness
	const [isProtonEnabled, setIsProtonEnabled] = useState(
		game.useProton ?? false,
	);
	const [selectedVariant, setSelectedVariant] = useState<ProtonVariant>(
		game.protonVariant ?? "proton-ge",
	);

	// tRPC queries
	const { data: installedBuilds, isLoading: isLoadingBuilds } =
		trpc.proton.getInstalledBuilds.useQuery();
	const { data: isProtonSupported } = trpc.proton.isProtonSupported.useQuery();

	// Update local state when game prop changes
	useEffect(() => {
		setIsProtonEnabled(game.useProton ?? false);
		setSelectedVariant(game.protonVariant ?? "proton-ge");
	}, [game.useProton, game.protonVariant]);

	// Handle proton toggle
	const handleProtonToggle = (checked: boolean) => {
		setIsProtonEnabled(checked);
		onGameChange({ useProton: checked });
		if (!checked) {
			// Clear proton settings when disabled
			onGameChange({ protonVariant: undefined, protonVersion: undefined });
		}
	};

	// Handle variant change
	const handleVariantChange = (variant: ProtonVariant) => {
		setSelectedVariant(variant);
		onGameChange({ protonVariant: variant, protonVersion: undefined });
	};

	// Handle version change
	const handleVersionChange = (version: string) => {
		onGameChange({ protonVersion: version });
	};

	// Don't render if Proton is not supported
	if (isProtonSupported === false) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("game_form.proton_configuration.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="mb-6 flex items-center justify-between space-x-2">
					<div className="grid gap-1">
						<Label htmlFor="useProton">
							{t("game_form.proton_configuration.enable_proton")}
						</Label>
						<p className="text-muted-foreground text-sm">
							{t("game_form.proton_configuration.enable_proton_description")}
						</p>
					</div>
					<Switch
						id="useProton"
						checked={isProtonEnabled}
						onCheckedChange={handleProtonToggle}
					/>
				</div>

				<fieldset
					className="grid gap-4 border-border border-t pt-4"
					disabled={!isProtonEnabled}
				>
					<legend className="sr-only">
						{t("game_form.proton_configuration.proton_details")}
					</legend>

					{/* Grid for Variant and Version to place them next to each other */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{/* Proton Variant */}
						<div className="grid w-full items-center gap-2">
							<Label htmlFor="protonVariant">
								{t("game_form.proton_configuration.proton_variant")}
							</Label>
							<p className="text-muted-foreground text-sm">
								{t("game_form.proton_configuration.proton_variant_description")}
							</p>
							<Select
								value={selectedVariant}
								onValueChange={handleVariantChange}
								disabled={!isProtonEnabled}
							>
								<SelectTrigger id="protonVariant">
									<SelectValue
										placeholder={t(
											"game_form.proton_configuration.select_proton_variant",
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="proton-ge">Proton-GE</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Proton Version */}
						<div className="grid w-full items-center gap-2">
							<Label htmlFor="protonVersion">
								{t("game_form.proton_configuration.proton_version")}
							</Label>
							<p className="text-muted-foreground text-sm">
								{isProtonEnabled
									? t(
											"game_form.proton_configuration.proton_version_description_enabled",
										)
									: t(
											"game_form.proton_configuration.proton_version_description_disabled",
										)}
							</p>
							<Select
								value={game.protonVersion || ""}
								onValueChange={handleVersionChange}
								disabled={!isProtonEnabled || isLoadingBuilds}
							>
								<SelectTrigger id="protonVersion">
									<SelectValue
										placeholder={
											isLoadingBuilds
												? t("game_form.proton_configuration.loading_versions")
												: t(
														"game_form.proton_configuration.select_proton_version",
													)
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{installedBuilds && installedBuilds.length > 0 ? (
										installedBuilds
											.filter((build) => build.variant === selectedVariant)
											.map((build) => (
												<SelectItem key={build.version} value={build.version}>
													{build.version}
													{build.isActive &&
														t("game_form.proton_configuration.active")}
												</SelectItem>
											))
									) : (
										<div className="px-2 py-1.5 text-muted-foreground text-sm">
											{t(
												"game_form.proton_configuration.no_proton_versions_installed",
											)}
										</div>
									)}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Additional info section */}
					{isProtonEnabled && (
						<div className="rounded-md bg-muted/50 p-3">
							<p className="text-muted-foreground text-sm">
								<strong>{t("game_form.proton_configuration.note")}:</strong>{" "}
								{t("game_form.proton_configuration.proton_note")}
							</p>
						</div>
					)}
				</fieldset>
			</CardContent>
		</Card>
	);
};
