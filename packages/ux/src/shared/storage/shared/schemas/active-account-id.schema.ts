import z from 'zod';

export const sActiveAccountId = z.union([z.null(), z.string()]);

export type SActiveAccountIdSchema = z.infer<typeof sActiveAccountId>;
