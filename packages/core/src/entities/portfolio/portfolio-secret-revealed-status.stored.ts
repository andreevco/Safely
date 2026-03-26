import z from 'zod';

export const sPortfolioSecretRevealedStatus = z.union([
    z.object({
        revealedAt: z.number(),
        revealedFromDevice: z.string()
    }),
    z.null()
]);

export type SPortfolioSecretRevealedStatus = z.infer<typeof sPortfolioSecretRevealedStatus>;
