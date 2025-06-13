import type { RouterOutputs } from "@/@types";
import { columns } from "./columns";
import { DataTable } from "./data-table";

type Account = RouterOutputs["accounts"]["getAll"];

// 1. Update props to receive data directly
interface AccountsTableProps {
	data: Account;
}

const AccountsTable = ({ data }: AccountsTableProps) => {
	return (
		<div className="">
			<DataTable columns={columns} data={data} />
		</div>
	);
};

export default AccountsTable;
