import { PortfolioType, WatchOnlySource } from './I-portfolio';
import { IPortfolioId } from './portfolio-id';
import { PortfolioNetworkType } from './portfolio-network-type';
import { Id } from '../../utils';
import { VMType } from '../blockchain';

export class PortfolioIdWatchOnly extends Id implements IPortfolioId {
    constructor(
        public readonly identifier: string,
        public readonly source: WatchOnlySource,
        public readonly network: PortfolioNetworkType,
        public readonly vmType: VMType
    ) {
        super();
    }

    public toString(): string {
        return this.of(
            'portfolio',
            PortfolioType.WATCH_ONLY,
            this.vmType,
            this.source,
            this.identifier,
            this.network
        );
    }

    public toJSON(): {
        identifier: string;
        source: WatchOnlySource;
        networkType: PortfolioNetworkType;
        vmType: VMType;
    } {
        return {
            identifier: this.identifier,
            source: this.source,
            networkType: this.network,
            vmType: this.vmType
        };
    }
}
