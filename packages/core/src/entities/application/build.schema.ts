import { z } from 'zod';

export const sBuild = z.enum(['ios', 'android']);
export type Build = z.infer<typeof sBuild>;
