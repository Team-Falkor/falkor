import type { ProtonVariant } from "@team-falkor/game-launcher";
import { useEffect, useState } from "react";
import type { Game } from "@/@types";
import { Badge } from "@/components/ui/badge";
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
	isProtonSupported?: boolean;
}

export const ProtonConfigurationCard = ({
	game,
	onGameChange,
	isProtonSupported,
}: ProtonConfigurationCardProps) => {
	const { t } = useLanguageContext();
	// Local state for UI responsiveness and proper synchronization
	const [isProtonEnabled, setIsProtonEnabled] = useState(
		game.useProton ?? false,
	);
	const [selectedVariant, setSelectedVariant] = useState<string>(
		game.protonVariant ?? "proton-ge",
	);
	const [selectedVersion, setSelectedVersion] = useState<string>(
		game.protonVersion ?? "",
	);

	// tRPC queries
	const { data: installedBuilds, isLoading: isLoadingBuilds } =
		trpc.proton.getInstalledBuilds.useQuery();

	// Update local state when game prop changes, but only if the user hasn't made local changes
	// This prevents external API calls from overriding user selections
	const [hasUserInteracted, setHasUserInteracted] = useState(false);

	useEffect(() => {
		// Only update from props if user hasn't interacted with the form yet
		if (!hasUserInteracted) {
			setIsProtonEnabled(game.useProton ?? false);
			setSelectedVariant(game.protonVariant ?? "proton-ge");
			setSelectedVersion(game.protonVersion ?? "");
		}
	}, [
		game.useProton,
		game.protonVariant,
		game.protonVersion,
		hasUserInteracted,
	]);

	useEffect(() => {
		onGameChange({
			useProton: isProtonEnabled,
			protonVariant: isProtonEnabled ? selectedVariant : undefined,
			protonVersion:
				isProtonEnabled && selectedVersion ? selectedVersion : undefined,
		});
	}, [isProtonEnabled, onGameChange, selectedVariant, selectedVersion]);

	// Handle proton toggle
	const handleProtonToggle = (checked: boolean) => {
		setHasUserInteracted(true);
		setIsProtonEnabled(checked);
		onGameChange({ useProton: checked });
		if (!checked) {
			// Clear proton settings when disabled
			setSelectedVariant("proton-ge");
			setSelectedVersion("");
			onGameChange({ protonVariant: undefined, protonVersion: undefined });
		}
	};

	// Handle variant change
	const handleVariantChange = (variant: ProtonVariant) => {
		setHasUserInteracted(true);
		setSelectedVariant(variant);
		// Clear version when variant changes as versions are variant-specific
		setSelectedVersion("");
		onGameChange({ protonVariant: variant, protonVersion: undefined });
	};

	// Handle version change
	const handleVersionChange = (version: string) => {
		setHasUserInteracted(true);
		setSelectedVersion(version);
		onGameChange({ protonVersion: version });
	};

	// Don't render if Proton is not supported
	if (isProtonSupported === false) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{t("game_form.proton_configuration.title")}
					<Badge variant="secondary" className="text-xs">
						{t("beta")}
					</Badge>
				</CardTitle>
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
					className="grid gap-6 border-border border-t pt-6"
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
								value={selectedVersion}
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
													<div className="flex w-full items-center justify-between">
														<span>{build.version}</span>
														{build.isActive && (
															<Badge variant="outline" className="ml-2 text-xs">
																{t("game_form.proton_configuration.active")}
															</Badge>
														)}
													</div>
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

					{/* Status and info section */}
					{isProtonEnabled && (
						<div className="space-y-3">
							{/* Info note */}
							<div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
								<p className="text-blue-700 text-sm dark:text-blue-300">
									<strong>{t("game_form.proton_configuration.note")}:</strong>{" "}
									{t("game_form.proton_configuration.proton_note")}
								</p>
							</div>
						</div>
					)}
				</fieldset>
			</CardContent>
		</Card>
	);
};
