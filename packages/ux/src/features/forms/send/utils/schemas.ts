import { z } from 'zod';

import { BtcAddress } from '@safely/core';

import { SendFormError } from '../errors';

export const recipientSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(
        z
            .string()
            .min(5, SendFormError.INVALID_WALLET_ADDRESS)
            .refine(val => BtcAddress.validate(val), {
                message: SendFormError.INVALID_WALLET_ADDRESS
            })
    );

export const assetIdSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1, SendFormError.SELECT_TOKEN));
