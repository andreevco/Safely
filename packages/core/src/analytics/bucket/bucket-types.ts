import z from 'zod';

export const sBucket = z.enum(['zero', 'dust', 'small', 'regular', 'medium', 'high', 'vip']);

export type Bucket = z.infer<typeof sBucket>;
