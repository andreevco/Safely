import { z } from 'zod';

export const sAmountUnit = z.enum(['crypto', 'fiat']);

export const sAmountDisplay = z
    .object({
        mainBalanceUnit: sAmountUnit,
        homeScreenOrder: sAmountUnit,
        transactionHistoryOrder: sAmountUnit,
        showFullSentAmount: z.boolean()
    })
    .partial();

export type SAmountUnit = z.infer<typeof sAmountUnit>;

export type SAmountDisplay = z.infer<typeof sAmountDisplay>;
