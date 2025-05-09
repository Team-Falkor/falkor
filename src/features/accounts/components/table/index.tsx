import { trpc } from "@/lib";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const AccountsTable = () => {
	const { data, isPending, error, isError } = trpc.accounts.getAll.useQuery();

	if (isPending) {
		return <div>Loading...</div>;
	}

	if (isError) {
		return <div>Error: {error.message}</div>;
	}

	if (!data) {
		return <div>No data</div>;
	}

	return (
		<div className="">
			<DataTable columns={columns} data={data} />
		</div>
	);
};

export default AccountsTable;
