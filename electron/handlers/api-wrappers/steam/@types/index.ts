/** Shape of a Steam user profile from GetPlayerSummaries */
export interface SteamProfile {
	steamid: string;
	personaname: string;
	profileurl: string;
	avatar: string;
	avatarmedium: string;
	avatarfull: string;
	avatarhash: string;
	lastlogoff: number;
	loccountrycode?: string;
	locstatecode?: string;
	loccityid?: number;
}

/** Response shape for GetPlayerSummaries */
export interface GetPlayerSummariesResponse {
	response: { players: SteamProfile[] };
}
