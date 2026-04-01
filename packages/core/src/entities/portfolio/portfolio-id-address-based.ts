import { PortfolioType } from './I-portfolio';
import { IPortfolioId } from './portfolio-id';
import { PortfolioNetworkType } from './portfolio-network-type';
import { Id } from '../../utils';

export class PortfolioIdAddressBased extends Id implements IPortfolioId {
    public static create(address: string, network: PortfolioNetworkType): PortfolioIdAddressBased {
        return new PortfolioIdAddressBased(address, network);
    }

    public readonly type = PortfolioType.WATCH_ONLY;

    constructor(
        public readonly address: string,
        public readonly network: PortfolioNetworkType
    ) {
        super();
    }

    public toString(): string {
        return this.of('portfolio', 'address', this.address, this.network);
    }

    public toJSON(): {
        type: PortfolioType.WATCH_ONLY;
        address: string;
        networkType: PortfolioNetworkType;
    } {
        return {
            type: this.type,
            address: this.address,
            networkType: this.network
        };
    }
}
