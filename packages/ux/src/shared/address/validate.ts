import type { PortfolioNetworkType } from '@safely/core';
import {
    BLOCKCHAIN_NAME,
    BtcAddress,
    btcNetworkByPortfolioNetworkType,
    btcNetworkConfig
} from '@safely/core';

import { InvalidAddressFormatError, UnsupportedBlockchainError } from './errors';

export interface DetectedAddress {
    blockchain: BLOCKCHAIN_NAME;
    address: string;
}

export function detectAddressType(
    input: string,
    networkType: PortfolioNetworkType
): DetectedAddress | null {
    if (!input) return null;

    if (
        BtcAddress.validate(input, btcNetworkConfig[btcNetworkByPortfolioNetworkType(networkType)])
    ) {
        return { blockchain: BLOCKCHAIN_NAME.BTC, address: input };
    }

    return null;
}

export function parseAddress(input: string, networkType: PortfolioNetworkType): DetectedAddress {
    const detected = detectAddressType(input, networkType);

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
