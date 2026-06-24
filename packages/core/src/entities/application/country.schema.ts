import { z } from 'zod';

export const userCountryInfoSchema = z.object({
    deviceCode: z.string(),
    storeCode: z.string()
});
