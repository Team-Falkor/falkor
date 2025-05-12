import { ChevronDown } from "lucide-react";
import { useState } from "react";
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
// import TorBoxDialogContent from "@/features/torBox/components/torBoxDialogContent";
import { cn, trpc } from "@/lib";

const AddAccountButton = () => {
	const utils = trpc.useUtils();
	const [isRealDebridDialogOpen, setIsRealDebridDialogOpen] = useState(false);
	const [isTorBoxDialogOpen, setIsTorBoxDialogOpen] = useState(false);
	const [open, setOpen] = useState(false);
	const { data: accounts } = trpc.accounts.getAll.useQuery();

	const realDebrid = accounts?.find(
		(account) => account.type === "real-debrid",
	);
	const torBox = accounts?.find((account) => account.type === "torbox");

	const handleAuthenticated = async () => {
		await utils.accounts.invalidate();
	};

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
					onAuthenticated={handleAuthenticated}
				/>
			</Dialog>

			{/* TorBox Dialog */}
			{/* <Dialog open={isTorBoxDialogOpen} onOpenChange={setIsTorBoxDialogOpen}>
        <TorBoxDialogContent
          setOpen={setIsTorBoxDialogOpen}
          open={isTorBoxDialogOpen}
        />
      </Dialog> */}
		</DropdownMenu>
	);
};

export default AddAccountButton;
