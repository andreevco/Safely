import z from 'zod';

export const sBucket = z.enum(['zero', 'dust', 'small', 'medium', 'high', 'vip']);

export type Bucket = z.infer<typeof sBucket>;
