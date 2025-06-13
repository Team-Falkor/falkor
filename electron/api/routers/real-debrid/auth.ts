import { EventEmitter } from "node:events";
import { publicProcedure, router } from "@backend/api/trpc";
import { RealDebridAuthService } from "@backend/handlers/api-wrappers/real-debrid";
import type {
	RealDebridDeviceCode,
	RealDebridToken,
} from "@backend/handlers/api-wrappers/real-debrid/@types";
import { emitOnce } from "@backend/utils/emit-once";
import { z } from "zod";

const authService = RealDebridAuthService.getInstance();

const emitter = new EventEmitter();

export const realDebridAuthRouter = router({
	// Step 1: get device code
	getDeviceCode: publicProcedure.query(
		async (): Promise<RealDebridDeviceCode> => {
			return await authService.getDeviceCode();
		},
	),

	// Step 2: subscription for polling token
	startPolling: publicProcedure
		.input(
			z.object({
				deviceCode: z.string(),
			}),
		)
		.subscription(async function* ({ input, signal }) {
			console.log("startPolling");
			const { deviceCode } = input;

			const onToken = (payload: { token: RealDebridToken }) =>
				emitter.emit("token", payload.token);
			const onError = (payload: { error: Error }) =>
				emitter.emit("error", payload.error);

			authService.on("token", onToken);
			authService.on("error", onError);

			authService.startPollingForToken(deviceCode);

			try {
				const result = await Promise.race([
					emitOnce<RealDebridToken>(emitter, "token").then((token) => ({
						token,
					})),
					emitOnce<Error>(emitter, "error").then((error) => ({ error })),
				]);

				yield result;
			} catch (error) {
				console.error(error);
				return;
			} finally {
				authService.off("token", onToken);
				authService.off("error", onError);
				// authService.stopPollingForToken(deviceCode);
			}

			return;
		}),

	// Step 3: refresh token
	refreshToken: publicProcedure
		.input(z.object({ refreshToken: z.string() }))
		.mutation(async ({ input }) => {
			return await authService.refreshToken(input.refreshToken);
		}),

	// Step 4: check token expiry
	checkTokenExpiry: publicProcedure
		.input(
			z.object({
				expiresIn: z.number(),
				timestamp: z.number(),
			}),
		)
		.query(({ input }) => {
			return authService.isTokenExpired(input.expiresIn, input.timestamp);
		}),
});

export type RealDebridAuthRouter = typeof realDebridAuthRouter;
