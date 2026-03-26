import { z } from 'zod';

export const BufferHexSchema = z.string().transform((x, ctx) => {
    try {
        return Buffer.from(x, 'hex');
    } catch {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid hex string for Buffer'
        });
        return z.NEVER;
    }
});
