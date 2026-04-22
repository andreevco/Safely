import { z } from 'zod';

import { BtcAddress } from '@safely/core';

import { SendFormError } from '../errors';
import { MIN_RECIPIENT_ADDRESS_LENGTH } from './constants';

export const recipientSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(
        z
            .string()
            .min(MIN_RECIPIENT_ADDRESS_LENGTH, SendFormError.INVALID_WALLET_ADDRESS)
            .refine(val => BtcAddress.validate(val), {
                message: SendFormError.INVALID_WALLET_ADDRESS
            })
    );

export const assetIdSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1, SendFormError.SELECT_TOKEN));
