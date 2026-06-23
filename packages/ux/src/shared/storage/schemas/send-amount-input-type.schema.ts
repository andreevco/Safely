import z from 'zod';

export const sSendAmountInputType = z.union([z.null(), z.enum(['crypto', 'fiat'])]);
