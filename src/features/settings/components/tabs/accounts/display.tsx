import { UserIcon } from "lucide-react";
import { useState } from "react";
import type { RouterOutputs } from "@/@types";
import { Card, CardContent } from "@/components/ui/card";
import { AccountCard } from "./account-card";

type Account = RouterOutputs["accounts"]["getAll"];

type Props = {
	accounts: Account;
};

export const AccountsDisplay = ({ accounts }: Props) => {
	const [openAccounts, setOpenAccounts] = useState<Set<number>>(new Set());
	const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

	const toggleAccount = (accountId: number) => {
		const newOpen = new Set(openAccounts);
		if (newOpen.has(accountId)) {
			newOpen.delete(accountId);
		} else {
			newOpen.add(accountId);
		}
		setOpenAccounts(newOpen);
	};

	const toggleTokenVisibility = (tokenKey: string) => {
		const newVisible = new Set(visibleTokens);
		if (newVisible.has(tokenKey)) {
			newVisible.delete(tokenKey);
		} else {
			newVisible.add(tokenKey);
		}
		setVisibleTokens(newVisible);
	};

	if (accounts.length === 0) {
		return (
			<Card className="w-full transition-shadow hover:shadow-md">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<UserIcon className="mb-4 h-12 w-12 text-muted-foreground" />
					<p className="font-medium text-lg text-muted-foreground">
						No accounts found
					</p>
					<p className="text-muted-foreground text-sm">
						Add an account to get started
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(500px,1fr))] gap-4">
			{accounts?.map((account) => (
				<AccountCard
					key={account.id}
					account={account}
					isOpen={openAccounts.has(account.id)}
					onToggle={toggleAccount}
					visibleTokens={visibleTokens}
					onToggleToken={toggleTokenVisibility}
					onDelete={console.log}
					onSetPreferred={console.log}
				/>
			))}
		</div>
	);
};
