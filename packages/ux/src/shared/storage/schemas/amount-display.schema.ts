import z from 'zod';

const sAmountUnit = z.enum(['crypto', 'fiat']);

const sAmountDisplaySettings = z.object({
    mainBalanceUnit: sAmountUnit.default('fiat'),
    homeScreenOrder: sAmountUnit.default('fiat'),
    transactionHistoryOrder: sAmountUnit.default('fiat'),
    showFullSentAmount: z.boolean().default(false)
});

export const sAmountDisplay = z
    .union([z.null(), sAmountDisplaySettings])
    .transform(settings => settings ?? sAmountDisplaySettings.parse({}));

export type AmountDisplay = z.output<typeof sAmountDisplay>;
