import z from 'zod';

export const sAccountMeta = z
    .object({
        name: z.string()
    })
    .nullable();

export type SAccountMeta = z.infer<typeof sAccountMeta>;
