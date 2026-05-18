import { z } from 'zod';

export const sBuild = z.enum(['ios', 'android', 'web']);
export type Build = z.infer<typeof sBuild>;
