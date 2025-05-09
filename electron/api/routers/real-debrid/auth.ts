import { EventEmitter } from "node:events";
import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import type {
	RealDebridDeviceCode,
	RealDebridToken,
} from "../../../handlers/api-wrappers/real-debrid/@types";
import { RealDebridAuthService } from "../../../handlers/api-wrappers/real-debrid/services/auth";
import { emitOnce } from "../../../utils/emit-once";

const authService = new RealDebridAuthService();

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
				interval: z.number().optional().default(5000),
			}),
		)
		.subscription(async function* ({ input }) {
			const { deviceCode, interval } = input;

			// Forward authService events to our emitter
			const onToken = (payload: { token: RealDebridToken }) =>
				emitter.emit("token", payload.token);
			const onError = (payload: { error: Error }) =>
				emitter.emit("error", payload.error);

			authService.on("token", onToken);
			authService.on("error", onError);

			// Start the polling process
			authService.startPollingForToken(deviceCode);

			try {
				// Wait for either 'token' or 'error'
				const result = await Promise.race([
					emitOnce<RealDebridToken>(emitter, "token").then((token) => ({
						token,
					})),
					emitOnce<Error>(emitter, "error").then((error) => ({ error })),
				]);

				// Yield the result back to the client
				yield result;
			} finally {
				// Cleanup listeners to prevent memory leaks
				authService.off("token", onToken);
				authService.off("error", onError);
			}
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
