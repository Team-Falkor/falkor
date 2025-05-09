import type { RealDebridToken } from ".";

export type AuthEventMap = {
	token: { token: RealDebridToken };
	error: { error: Error };
	polling_start: { deviceCode: string };
	polling_stop: undefined;
};
