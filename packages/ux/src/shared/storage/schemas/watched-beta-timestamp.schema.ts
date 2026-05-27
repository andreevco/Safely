import z from 'zod';

export const sWatchedBetaTimestamp = z.union([z.null(), z.number()]);

export type SWatchedBetaTimestampSchema = z.infer<typeof sWatchedBetaTimestamp>;
