import { z } from 'zod';

import type { PortfolioNetworkType } from '@safely/core';

import { detectAddressType } from '../../../../shared/address';
import { SendFormError } from '../errors';

export const createRecipientSchema = (networkType: PortfolioNetworkType) =>
    z
        .string()
        .transform(val => val.trim())
        .pipe(
            z.string().refine(val => detectAddressType(val, networkType) !== null, {
                message: SendFormError.INVALID_WALLET_ADDRESS
            })
        );

export const assetIdSchema = z
    .string()
    .transform(val => val.trim())
    .pipe(z.string().min(1, SendFormError.SELECT_TOKEN));
