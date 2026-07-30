import z from 'zod';

const sAmountUnit = z.enum(['crypto', 'fiat']);

export const sAmountDisplay = z
    .object({
        mainBalanceUnit: sAmountUnit,
        homeScreenOrder: sAmountUnit,
        transactionHistoryOrder: sAmountUnit,
        showFullSentAmount: z.boolean()
    })
    .partial()
    .nullable();

export type AmountDisplay = z.output<typeof sAmountDisplay>;
