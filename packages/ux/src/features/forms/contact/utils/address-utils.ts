import { BLOCKCHAIN_NAME, BtcAddress } from '@safely/core';

import { ContactFormError } from '../errors';

export interface DetectedContactAddress {
    blockchain: BLOCKCHAIN_NAME;
    address: string;
}

export function detectAddressType(input: string): DetectedContactAddress | null {
    if (!input) return null;

    if (BtcAddress.validate(input)) {
        return { blockchain: BLOCKCHAIN_NAME.BTC, address: input };
    }

    return null;
}

export function parseContactAddress(input: string): DetectedContactAddress | ContactFormError {
    const detected = detectAddressType(input);

    if (!detected) {
        return ContactFormError.INVALID_ADDRESS_FORMAT;
    }

    switch (detected.blockchain) {
        case BLOCKCHAIN_NAME.BTC:
            return detected;
        default:
            return ContactFormError.UNSUPPORTED_BLOCKCHAIN;
    }
}
