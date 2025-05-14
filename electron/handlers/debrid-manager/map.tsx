import { db } from "@backend/database";
import { accounts } from "@backend/database/schemas";
import { RealDebridClient } from "../api-wrappers/real-debrid";

type DebridService = RealDebridClient;

type DebriServiceType = "real-debrid" | "torbox";

export const debridProviders: Map<DebriServiceType, DebridService> = new Map();

export const initRealDebrid = async (
	access_token: string,
	isUpdate = false,
): Promise<RealDebridClient> => {
	let client = debridProviders.get("real-debrid") as
		| RealDebridClient
		| undefined;
	if (isUpdate || !client) {
		client = RealDebridClient.getInstance(access_token);
		debridProviders.set("real-debrid", client);
	}
	return client;
};

// TODO: torbox

(async () => {
	const externalAccounts = await db.select().from(accounts);
	const realDebridFromDB = externalAccounts.find(
		(account) => account.type === "real-debrid",
	);

	if (realDebridFromDB?.accessToken) {
		await initRealDebrid(realDebridFromDB.accessToken);
	}
})();
