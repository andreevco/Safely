import z from 'zod';

export const sAccountMetaIconEmoji = z.object({
    type: z.literal('emoji'),
    value: z.string()
});

export const sAccountMetaIconColor = z.object({
    type: z.literal('color'),
    value: z.string()
});

export const sAccountMeta = z.object({
    name: z.string(),
    icon: z.union([sAccountMetaIconEmoji, sAccountMetaIconColor])
});

export const sAccountDataSchema = z.union([
    z.object({
        meta: sAccountMeta
    }),
    z.null()
]);
