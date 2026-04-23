import z from 'zod';

export const sContactMeta = z.object({
    name: z.string(),
    color: z.string()
});

export type SContactMeta = z.infer<typeof sContactMeta>;
