import { z } from 'zod';

import { BtcAddress } from '@safely/core';

import { SendFormError } from '../errors';

export const recipientSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(
        z
            .string()
            .min(5, SendFormError.ENTER_RECIPIENT_ADDRESS)
            .refine(val => BtcAddress.validate(val), {
                message: SendFormError.INVALID_ADDRESS_FORMAT
            })
    );

export const assetIdSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1, SendFormError.SELECT_TOKEN));
