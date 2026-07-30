import { z } from 'zod';

export const userCountryInfoSchema = z.object({
    deviceCode: z.string().nullable(),
    storeCode: z.string().nullable()
});
