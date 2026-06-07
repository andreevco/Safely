import z from 'zod';

export const sActivePortfolioSchema = z
    .object({
        portfolioId: z.string(),
        derivationIndex: z.number().optional()
    })
    .nullable();

export type SActivePortfolioSchema = z.infer<typeof sActivePortfolioSchema>;
