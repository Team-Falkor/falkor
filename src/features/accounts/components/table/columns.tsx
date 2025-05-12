import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import type { RouterOutputs } from "@/@types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteAccount } from "../delete";
import { SetAsPreferred } from "../setPreferred";

type ExternalAccountColumn = RouterOutputs["accounts"]["getAll"][number];

export const columns: ColumnDef<ExternalAccountColumn>[] = [
	{
		accessorKey: "avatar",
		header: "Avatar",
		cell: ({ row }) => {
			return (
				<div className="flex items-center justify-start pl-3">
					<Avatar className="size-7">
						<AvatarImage
							src={row?.original?.avatar ?? undefined}
							alt={row?.original?.username ?? undefined}
						/>
						<AvatarFallback>{row.original.username?.charAt(0)}</AvatarFallback>
					</Avatar>
				</div>
			);
		},
	},
	{
		accessorKey: "username",
		header: "Username",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "access_token",
		header: "Access Token",
		cell: ({ row }) => {
			return (
				<span className="text-muted-foreground text-xs">
					{row.original.accessToken?.slice(0, 2)}
					...
					{row.original.accessToken?.slice(-5)}
				</span>
			);
		},
	},
	{
		accessorKey: "type",
		header: "Type",
		cell: ({ row }) => {
			return (
				<span className="capitalize">
					{row.original.type?.toString().replace("-", " ")}
				</span>
			);
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const { original } = row;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="max-w-40">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>

						<DropdownMenuSeparator />

						{/* TODO: create custom components for these so i can use the trpc hooks */}
						{!!original?.type && (
							<DropdownMenuItem asChild>
								<SetAsPreferred type={original.type} />
							</DropdownMenuItem>
						)}
						<DropdownMenuItem asChild>
							<DeleteAccount id={original.id} />
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
