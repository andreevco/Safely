import { sha256 } from '@noble/hashes/sha2.js';

import { PortfolioType } from './I-portfolio';
import { IPortfolioId } from './portfolio-id';
import { allowedPortfolioMetaEmojis, PortfolioMetaIconEmoji } from './portfolio-meta';
import { PortfolioNetworkType } from './portfolio-network-type';
import { Id } from '../../utils';

export class PortfolioIdAddressBased extends Id implements IPortfolioId {
    public static create(address: string, network: PortfolioNetworkType): PortfolioIdAddressBased {
        const hash = Buffer.from(sha256(Buffer.from(address.toLowerCase()))).toString('hex');

        return new PortfolioIdAddressBased(hash, network);
    }

    public readonly type = PortfolioType.WATCH_ONLY;

    constructor(
        private readonly hash: string,
        public readonly network: PortfolioNetworkType
    ) {
        super();
    }

    public getFallbackEmoji(): PortfolioMetaIconEmoji {
        const index =
            Buffer.from(this.hash, 'hex').readUint32BE() % allowedPortfolioMetaEmojis.length;

        return { type: 'emoji', value: allowedPortfolioMetaEmojis[index] };
    }

    public toString(): string {
        return this.of('portfolio', this.hash, this.network);
    }

    public toJSON(): {
        type: PortfolioType.WATCH_ONLY;
        hash: string;
        networkType: PortfolioNetworkType;
    } {
        return {
            type: this.type,
            hash: this.hash,
            networkType: this.network
        };
    }
}
