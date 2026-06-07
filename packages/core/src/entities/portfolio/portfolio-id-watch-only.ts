import type {
    SPortfolioWatchOnlyId,
    SPortfolioWatchOnlyIdAddress,
    SPortfolioWatchOnlyIdXpub
} from '@safely/sync-storage';
import { portfolioWatchOnlyIdToString } from '@safely/sync-storage';

import { WatchOnlySource } from './I-portfolio';
import type { IPortfolioId } from './I-portfolio';
import type { PortfolioNetworkType } from './portfolio-network-type';
import { assertUnreachable, Id } from '../../utils';

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
