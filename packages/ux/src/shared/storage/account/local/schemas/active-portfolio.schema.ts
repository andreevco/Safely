import z from 'zod';

export const sActivePortfolioSchema = z.union([
    z.null(),
    z.object({
        portfolioId: z.string(),
        derivationId: z.string().nullable()
    })
]);

export type SActivePortfolioSchema = z.infer<typeof sActivePortfolioSchema>;
