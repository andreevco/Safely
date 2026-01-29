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

export type CurrentPrice = z.infer<typeof CurrentPriceSchema>;
