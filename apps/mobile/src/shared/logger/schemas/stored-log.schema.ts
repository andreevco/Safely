import z from 'zod';

import { LogLevel } from '@safely/sync';

export const sStoredLog = z.object({
    t: z.string(),
    l: z.enum(LogLevel),
    p: z.array(z.string()),
    m: z.string(),
    v: z.string(),
    b: z.string(),
    d: z.string()
});

export type StoredLog = z.infer<typeof sStoredLog>;
