import z from 'zod';

export const sAmountDisplayOrder = z.union([z.null(), z.enum(['crypto', 'fiat'])]);
