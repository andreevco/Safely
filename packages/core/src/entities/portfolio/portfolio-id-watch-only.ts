import type {
    SPortfolioWatchOnlyId,
    SPortfolioWatchOnlyIdAddress,
    SPortfolioWatchOnlyIdXpub
} from '@safely/sync-storage';
import { portfolioWatchOnlyIdToString } from '@safely/sync-storage';

import { WatchOnlySource } from './I-portfolio';
import type { IPortfolioId } from './portfolio-id-bip39';
import type { PortfolioMetaIconEmoji } from './portfolio-meta';
import { allowedPortfolioMetaEmojis } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import { BtcXpub } from '../../blockchain-api';
import { assertUnreachable, Id, sha256PrefixNumber } from '../../utils';
import { BtcNetwork, BtcWalletType } from '../blockchain';

export class PortfolioIdWatchOnlyXpub extends Id implements IPortfolioId {
    public readonly source = WatchOnlySource.XPUB;

    public readonly network: PortfolioNetworkType;

    public readonly xpub: string;

    constructor(serialized: Omit<SPortfolioWatchOnlyIdXpub, 'source'>) {
        super();
        this.network = serialized.networkType;
        this.xpub = serialized.xpub;
    }

    public toString(): string {
        return portfolioWatchOnlyIdToString(this.toJSON());
    }

    public getFallbackEmoji() {
        return getEmojiByBtcAddress(
            BtcXpub.deriveAddress(this.xpub, BtcNetwork.MAINNET, BtcWalletType.NATIVE_SEGWIT)
        );
    }

    public toJSON(): SPortfolioWatchOnlyIdXpub {
        return {
            source: this.source,
            networkType: this.network,
            xpub: this.xpub
        };
    }
}

export class PortfolioIdWatchOnlyAddress extends Id implements IPortfolioId {
    public readonly source = WatchOnlySource.ADDRESS;

    public readonly network: PortfolioNetworkType;

    public readonly address: string;

    constructor(serialized: Omit<SPortfolioWatchOnlyIdAddress, 'source'>) {
        super();
        this.network = serialized.networkType;
        this.address = serialized.address;
    }

    public getFallbackEmoji() {
        return getEmojiByBtcAddress(this.address);
    }

    public toString(): string {
        return portfolioWatchOnlyIdToString(this.toJSON());
    }

    public toJSON(): SPortfolioWatchOnlyIdAddress {
        return {
            source: this.source,
            networkType: this.network,
            address: this.address
        };
    }
}

function getEmojiByBtcAddress(address: string): PortfolioMetaIconEmoji {
    const index =
        sha256PrefixNumber(`safely/v1/portfolio-emoji/address/${address}`) %
        allowedPortfolioMetaEmojis.length;

    return { type: 'emoji', value: allowedPortfolioMetaEmojis[index] };
}

export type PortfolioIdWatchOnly = PortfolioIdWatchOnlyXpub | PortfolioIdWatchOnlyAddress;
export function toPortfolioIdWatchOnly(serialized: SPortfolioWatchOnlyId) {
    switch (serialized.source) {
        case WatchOnlySource.XPUB:
            return new PortfolioIdWatchOnlyXpub(serialized);
        case WatchOnlySource.ADDRESS:
            return new PortfolioIdWatchOnlyAddress(serialized);
        default:
            assertUnreachable(serialized);
    }
}
