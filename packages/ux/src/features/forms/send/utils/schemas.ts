import { z } from 'zod';

import { SendFormError } from '../errors';
import { BTC_ADDRESS_PATTERN } from './constants';

const isValidAddressFormat = (value: string): boolean => {
    return BTC_ADDRESS_PATTERN.test(value);
};

export const recipientSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(
        z
            .string()
            .min(5, SendFormError.ENTER_RECIPIENT_ADDRESS)
            .refine(isValidAddressFormat, { message: SendFormError.INVALID_ADDRESS_FORMAT })
    );

export const assetIdSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1, SendFormError.SELECT_TOKEN));
