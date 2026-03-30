import z from 'zod';

export const sAccountMetaIconEmoji = z.object({
    type: z.literal('emoji'),
    value: z.string()
});

export const sAccountMetaIconColor = z.object({
    type: z.literal('color'),
    value: z.string()
});

export type AccountMeta = Exclude<z.infer<typeof sAccountMeta>, null>;
export const sAccountMeta = z.union([
    z.object({
        name: z.string(),
        icon: z.union([sAccountMetaIconEmoji, sAccountMetaIconColor])
    }),
    z.null()
]);
