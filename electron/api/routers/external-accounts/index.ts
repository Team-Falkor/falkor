import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../../../api/trpc";
import { accounts } from "../../../database/schemas";

const typeSchema = z.enum(["real-debrid", "torbox"]);

export const externalAccountsRouter = router({
	getAll: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.select().from(accounts);
	}),

	getById: publicProcedure.input(z.number()).query(async ({ input, ctx }) => {
		return await ctx.db.select().from(accounts).where(eq(accounts.id, input));
	}),

	create: publicProcedure
		.input(
			z.object({
				username: z.string().optional(),
				email: z.string().optional(),
				avatar: z.string().optional(),
				clientId: z.string().optional(),
				clientSecret: z.string(),
				accessToken: z.string(),
				refreshToken: z.string(),
				expiresIn: z.number(),
				type: typeSchema,
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const account = await ctx.db
				.insert(accounts)
				.values(input)
				.returning()
				.execute();

			return account;
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.number(),
				username: z.string().optional(),
				email: z.string().optional(),
				avatar: z.string().optional(),
				clientId: z.string().optional(),
				clientSecret: z.string().optional(),
				accessToken: z.string().optional(),
				refreshToken: z.string().optional(),
				expiresIn: z.number().optional(),
				type: typeSchema.optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { id, ...updateData } = input;
			const account = await ctx.db
				.update(accounts)
				.set(updateData)
				.where(eq(accounts.id, id))
				.returning()
				.execute();

			return account;
		}),

	delete: publicProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
		const deletedRows = await ctx.db
			.delete(accounts)
			.where(eq(accounts.id, input))
			.returning();

		return { success: deletedRows.length > 0 };
	}),
});
