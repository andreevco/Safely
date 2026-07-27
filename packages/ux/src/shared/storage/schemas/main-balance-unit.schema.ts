import z from 'zod';

export const sMainBalanceUnit = z.union([z.null(), z.enum(['fiat', 'crypto'])]);
