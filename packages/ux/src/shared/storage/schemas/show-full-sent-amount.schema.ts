import z from 'zod';

export const sShowFullSentAmount = z.union([z.null(), z.boolean()]);
