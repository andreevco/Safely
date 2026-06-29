import { z } from 'zod';

export interface GetCurrentPriceParams {
    token: string;
    currency: string;
    blockchain: string;
}

export const CurrentPriceSchema = z.object({
    price: z.number(),
    diff_24h: z.number()
});

export interface GetHistoricalPriceParams {
    token: string;
    currency: string;
    blockchain: string;
    start_date: number;
    end_date: number;
}

export const HistoricalPriceSchema = z.object({
    prices: z.array(z.tuple([z.number(), z.number()])).describe('[timestamp, price] pair'),
    attribution: z
        .looseObject({
            provider: z.string(),
            label: z.string().optional(),
            url: z.string().optional()
        })
        .optional()
});

export type CurrentPrice = z.infer<typeof CurrentPriceSchema>;
export type HistoricalPrice = z.infer<typeof HistoricalPriceSchema>;
