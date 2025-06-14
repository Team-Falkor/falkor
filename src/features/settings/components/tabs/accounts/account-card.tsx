import { TrashIcon } from "@radix-ui/react-icons";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	ClockIcon,
	CopyIcon,
	EyeIcon,
	EyeOffIcon,
	KeyIcon,
	MailIcon,
	StarIcon, // Added for the 'preferred' button
	UserIcon,
} from "lucide-react";
import type { RouterOutputs } from "@/@types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// By including `isPreferred`, the component can visually represent this state.
type Account = RouterOutputs["accounts"]["getAll"][number] & {
	isPreferred?: boolean;
};

type AccountCardProps = {
	account: Account;
	isOpen: boolean;
	onToggle: (accountId: number) => void;
	visibleTokens: Set<string>;
	onToggleToken: (tokenKey: string) => void;
	// Adding handlers makes the component's actions configurable from the parent
	onSetPreferred: (accountId: number) => void;
	onDelete: (accountId: number) => void;
};

const maskToken = (token: string) => {
	if (token.length <= 8) return "*".repeat(token.length);
	return `${token.slice(0, 4)}${"*".repeat(token.length - 8)}${token.slice(
		-4,
	)}`;
};

const formatExpiryTime = (expiresIn: number) => {
	// Note: OAuth `expires_in` is typically in seconds.
	// Ensure this value is in milliseconds before adding to Date.now().
	const expiryTime = Date.now() + expiresIn * 1000;
	const date = new Date(expiryTime);
	return date.toLocaleString();
};

const copyToClipboard = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text);
	} catch (err) {
		console.error("Failed to copy:", err);
	}
};

const InfoRow = ({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType;
	label: string;
	value: string;
}) => (
	<div className="flex items-center gap-2">
		<Icon className="h-4 w-4 text-muted-foreground" />
		<span className="font-medium text-sm">{label}:</span>
		<span className="text-sm">{value}</span>
	</div>
);

const SecretField = ({
	label,
	value,
	visibilityKey,
	isVisible,
	onToggleVisibility,
	expiryTime,
}: {
	label: string;
	value: string;
	visibilityKey: string;
	isVisible: boolean;
	onToggleVisibility: (key: string) => void;
	expiryTime?: number | null;
}) => (
	<div className="space-y-2">
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<KeyIcon className="h-4 w-4 text-muted-foreground" />
				<span className="font-medium text-sm">{label}:</span>
			</div>
			{expiryTime && (
				<div className="flex items-center gap-1 text-muted-foreground text-xs">
					<ClockIcon className="h-3 w-3" />
					<span>Expires: {formatExpiryTime(expiryTime)}</span>
				</div>
			)}
		</div>
		<div className="group flex items-center gap-2 rounded bg-muted/50 p-2 transition-colors hover:bg-muted/70">
			<code className="flex-1 select-all font-mono text-xs">
				{isVisible ? value : maskToken(value)}
			</code>
			<div className="flex gap-1">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onToggleVisibility(visibilityKey)}
					className="hover:bg-background/50"
				>
					{isVisible ? (
						<EyeOffIcon className="h-3 w-3" />
					) : (
						<EyeIcon className="h-3 w-3" />
					)}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => copyToClipboard(value)}
					className="hover:bg-background/50"
				>
					<CopyIcon className="h-3 w-3" />
				</Button>
			</div>
		</div>
	</div>
);

export const AccountCard = ({
	account,
	isOpen,
	onToggle,
	visibleTokens,
	onToggleToken,
	onSetPreferred,
	onDelete,
}: AccountCardProps) => {
	const accountTypeDisplay = account.type
		?.split("-")
		?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		?.join(" ");

	return (
		<Card className="w-full overflow-hidden p-0 transition-shadow hover:shadow-md">
			<Collapsible open={isOpen} onOpenChange={() => onToggle(account.id)}>
				<CollapsibleTrigger asChild>
					<CardHeader
						className={cn(
							"cursor-pointer p-4 transition-colors sm:p-6",
							"hover:bg-muted/50",
							isOpen && "bg-muted/30",
						)}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10 ring-2 ring-muted-foreground/10">
									<AvatarImage
										src={account.avatar || undefined}
										alt={account.username || "Account"}
									/>
									<AvatarFallback className="bg-muted">
										{account.username?.charAt(0).toUpperCase() ||
											account.email?.charAt(0).toUpperCase() ||
											"A"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col items-start">
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="font-semibold">
											{account.username || account.email || "Unknown"}
										</h3>
										{account.type && (
											<Badge
												variant="secondary"
												className="bg-muted-foreground/10 capitalize"
											>
												{accountTypeDisplay}
											</Badge>
										)}
									</div>
									{account.username && account.email && (
										<p className="text-muted-foreground text-sm">
											{account.email}
										</p>
									)}
								</div>
							</div>
							{isOpen ? (
								<ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
							)}
						</div>
					</CardHeader>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<CardContent className="px-4 pt-2 pb-4 sm:px-6 sm:pt-4 sm:pb-6">
						<div className="grid gap-6">
							{/* Basic Information */}
							<div className="grid gap-3">
								<h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
									Account Information
								</h4>
								{account.username && (
									<InfoRow
										icon={UserIcon}
										label="Username"
										value={account.username}
									/>
								)}
								{account.email && (
									<InfoRow
										icon={MailIcon}
										label="Email"
										value={account.email}
									/>
								)}
							</div>

							{/* API Credentials */}
							{(account.clientId || account.clientSecret) && (
								<div className="grid gap-3">
									<h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
										API Credentials
									</h4>
									{account.clientId && (
										<SecretField
											label="Client ID"
											value={account.clientId}
											visibilityKey={`client-${account.id}`}
											isVisible={visibleTokens.has(`client-${account.id}`)}
											onToggleVisibility={onToggleToken}
										/>
									)}
									{account.clientSecret && (
										<SecretField
											label="Client Secret"
											value={account.clientSecret}
											visibilityKey={`secret-${account.id}`}
											isVisible={visibleTokens.has(`secret-${account.id}`)}
											onToggleVisibility={onToggleToken}
										/>
									)}
								</div>
							)}

							{/* Tokens */}
							{(account.accessToken || account.refreshToken) && (
								<div className="grid gap-3">
									<h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
										Authentication Tokens
									</h4>
									{account.accessToken && (
										<SecretField
											label="Access Token"
											value={account.accessToken}
											visibilityKey={`access-${account.id}`}
											isVisible={visibleTokens.has(`access-${account.id}`)}
											onToggleVisibility={onToggleToken}
											expiryTime={account.expiresIn}
										/>
									)}
									{account.refreshToken && (
										<SecretField
											label="Refresh Token"
											value={account.refreshToken}
											visibilityKey={`refresh-${account.id}`}
											isVisible={visibleTokens.has(`refresh-${account.id}`)}
											onToggleVisibility={onToggleToken}
										/>
									)}
								</div>
							)}
						</div>
					</CardContent>

					{/* --- IMPROVED FOOTER --- */}
					<CardFooter className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-4">
						<Button
							variant="destructive"
							size="sm"
							onClick={() => onDelete(account.id)}
						>
							<TrashIcon />
							Delete
						</Button>
						<Button
							variant={account.isPreferred ? "active" : "functional"}
							size="sm"
							onClick={() => onSetPreferred(account.id)}
							disabled={account.isPreferred}
						>
							<StarIcon className={cn(account.isPreferred && "fill-current")} />
							{account.isPreferred ? "Preferred" : "Set as preferred"}
						</Button>
					</CardFooter>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
};
