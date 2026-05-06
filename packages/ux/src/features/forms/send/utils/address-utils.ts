import type { Recipient } from '@safely/core';
import { BLOCKCHAIN_NAME, BtcAddress, BtcRecipient } from '@safely/core';

import { SendFormError } from '../errors';

export interface DetectedAddressType {
    blockchain: BLOCKCHAIN_NAME;
}

export function detectAddressType(input: string): DetectedAddressType | null {
    if (!input) return null;

    if (BtcAddress.validate(input)) {
        return { blockchain: BLOCKCHAIN_NAME.BTC };
    }

    return null;
}

export function parseRecipient(input: string): Recipient | SendFormError {
    const detectedType = detectAddressType(input);

    if (!detectedType) {
        return SendFormError.INVALID_WALLET_ADDRESS;
    }

    switch (detectedType.blockchain) {
        case BLOCKCHAIN_NAME.BTC:
            return new BtcRecipient(input);
        default:
            return SendFormError.UNSUPPORTED_BLOCKCHAIN;
    }
}
