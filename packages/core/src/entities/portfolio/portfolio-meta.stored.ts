import z from 'zod';

export const sPortfolioMetaIconEmoji = z.object({
    type: z.literal('emoji'),
    value: z.string()
});

export const sPortfolioMetaIconColor = z.object({
    type: z.literal('color'),
    value: z.string()
});

export const sPortfolioMetaIcon = z.union([sPortfolioMetaIconEmoji, sPortfolioMetaIconColor]);

export type SPortfolioMetaIcon = z.infer<typeof sPortfolioMetaIcon>;

export const sPortfolioMeta = z.object({
    name: z.string(),
    icon: sPortfolioMetaIcon,
    seedRevealedAt: z.union([z.number(), z.null()])
});

export type SPortfolioMeta = z.infer<typeof sPortfolioMeta>;
