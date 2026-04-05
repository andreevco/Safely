import { WatchOnlySource } from './I-portfolio';
import { IPortfolioId } from './portfolio-id';
import { PortfolioNetworkType } from './portfolio-network-type';
import { Id } from '../../utils';

export class PortfolioIdWatchOnly extends Id implements IPortfolioId {
    constructor(
        public readonly identifier: string,
        public readonly source: WatchOnlySource,
        public readonly network: PortfolioNetworkType
    ) {
        super();
    }

    public toString(): string {
        return this.of('portfolio', 'watch-only', this.source, this.identifier, this.network);
    }

    public toJSON(): {
        identifier: string;
        source: WatchOnlySource;
        networkType: PortfolioNetworkType;
    } {
        return {
            identifier: this.identifier,
            source: this.source,
            networkType: this.network
        };
    }
}
