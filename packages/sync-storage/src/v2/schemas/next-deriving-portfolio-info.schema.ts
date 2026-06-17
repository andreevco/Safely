import { z } from 'zod';

export const sNextDerivingPortfolioInfo = z
    .object({
        emoji: z.string().optional(),
        index: z.number().int().nonnegative()
    })
    .nullable();

export type SNextDerivingPortfolioInfo = z.infer<typeof sNextDerivingPortfolioInfo>;
