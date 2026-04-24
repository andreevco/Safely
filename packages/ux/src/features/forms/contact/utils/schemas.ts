import { z } from 'zod';

import { ContactFormError } from '../errors';

export const nameSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1, ContactFormError.ENTER_NAME))
    .pipe(z.string().max(32, ContactFormError.TOO_LONG_NAME));

export const addressSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1, ContactFormError.ENTER_ADDRESS));
