import z from 'zod';

export const sActivePortfolioSchema = z.union([
    z.null(),
    z.object({
        /**
         * Current active portfolio and derivation
         */
        portfolioId: z.string(),
        derivationId: z.string()
    })
]);

export type SActivePortfolioSchema = z.infer<typeof sActivePortfolioSchema>;
