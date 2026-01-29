import { BLOCKCHAIN_NAME, BtcRecipient, Recipient } from '@safely/core';

import { SendFormError } from '../errors';
import { BTC_ADDRESS_PATTERN } from './constants';

export interface DetectedAddressType {
    blockchain: BLOCKCHAIN_NAME;
}

export function detectAddressType(input: string): DetectedAddressType | null {
    if (!input) return null;

    if (BTC_ADDRESS_PATTERN.test(input)) {
        return { blockchain: BLOCKCHAIN_NAME.BTC };
    }

    return null;
}

export function parseRecipient(input: string): Recipient | SendFormError {
    const detectedType = detectAddressType(input);

    if (!detectedType) {
        return SendFormError.INVALID_ADDRESS_FORMAT;
    }

    switch (detectedType.blockchain) {
        case BLOCKCHAIN_NAME.BTC:
            return new BtcRecipient(input);
        default:
            return SendFormError.UNSUPPORTED_BLOCKCHAIN;
    }
}
