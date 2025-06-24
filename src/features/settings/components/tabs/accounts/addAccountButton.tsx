import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { RouterOutputs } from "@/@types";
import { ButtonWithIcon } from "@/components/buttonWithIcon";
import { Dialog } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RealDebridDialogContent from "@/features/debrid/components/real-debrid/real-debrid-dialog-content";
import TorBoxDialogContent from "@/features/debrid/components/torbox/torbox-dialog";
import { cn } from "@/lib";

type Account = RouterOutputs["accounts"]["getAll"];

// 1. Define props for the component
interface AddAccountButtonProps {
	accounts: Account;
	onAccountAdded: () => void;
}

const AddAccountButton = ({
	accounts,
	onAccountAdded,
}: AddAccountButtonProps) => {
	const [isRealDebridDialogOpen, setIsRealDebridDialogOpen] = useState(false);
	const [isTorBoxDialogOpen, setIsTorBoxDialogOpen] = useState(false);
	const [open, setOpen] = useState(false);

	const realDebrid = accounts?.find(
		(account) => account.type === "real-debrid",
	);
	const torBox = accounts?.find((account) => account.type === "torbox");

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
					Add Account
				</ButtonWithIcon>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuLabel>Choose an account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() => setIsRealDebridDialogOpen(true)}
					disabled={!!realDebrid}
				>
					Real Debrid ({realDebrid ? "Connected" : "Not Connected"})
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() => setIsTorBoxDialogOpen(true)}
					disabled={!!torBox}
				>
					TorBox ({torBox ? "Connected" : "Not Connected"})
				</DropdownMenuItem>
			</DropdownMenuContent>

			{/* Real Debrid Dialog */}
			<Dialog
				open={isRealDebridDialogOpen}
				onOpenChange={setIsRealDebridDialogOpen}
			>
				<RealDebridDialogContent
					setOpen={setIsRealDebridDialogOpen}
					open={isRealDebridDialogOpen}
					onAuthenticated={onAccountAdded}
				/>
			</Dialog>

			{/* TorBox Dialog */}
			<Dialog open={isTorBoxDialogOpen} onOpenChange={setIsTorBoxDialogOpen}>
				<TorBoxDialogContent
					setOpen={setIsTorBoxDialogOpen}
					open={isTorBoxDialogOpen}
				/>
			</Dialog>
		</DropdownMenu>
	);
};

export default AddAccountButton;
