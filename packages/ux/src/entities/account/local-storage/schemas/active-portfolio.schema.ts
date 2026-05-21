import z from 'zod';

export const sActivePortfolioSchema = z
    .object({
        portfolioId: z.string()
    })
    .nullable();

export type SActivePortfolioSchema = z.infer<typeof sActivePortfolioSchema>;
