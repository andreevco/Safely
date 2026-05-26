import { z } from 'zod';

export interface GetRateParams {
    currency: string;
}

export const RateSchema = z.object({
    rate: z.number().positive()
});

export type RateResponse = z.infer<typeof RateSchema>;
