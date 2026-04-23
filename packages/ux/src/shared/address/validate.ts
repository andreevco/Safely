import { BLOCKCHAIN_NAME, BtcAddress } from '@safely/core';

import { InvalidAddressFormatError, UnsupportedBlockchainError } from './errors';

export interface DetectedAddress {
    blockchain: BLOCKCHAIN_NAME;
    address: string;
}

export function detectAddressType(input: string): DetectedAddress | null {
    if (!input) return null;

    if (BtcAddress.validate(input)) {
        return { blockchain: BLOCKCHAIN_NAME.BTC, address: input };
    }

    return null;
}

export function parseAddress(input: string): DetectedAddress {
    const detected = detectAddressType(input);

    if (!detected) {
        throw new InvalidAddressFormatError();
    }

    switch (detected.blockchain) {
        case BLOCKCHAIN_NAME.BTC:
            return detected;
        default:
            throw new UnsupportedBlockchainError();
    }
}
