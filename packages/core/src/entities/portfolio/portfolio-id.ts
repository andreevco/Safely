import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';

import { PortfolioType } from './I-portfolio';
import type { PortfolioMetaIconEmoji } from './portfolio-meta';
import { allowedPortfolioMetaEmojis } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import { xorFold16 } from '../../utils/crypto';
import { Id } from '../../utils/id';
import type { IMnemonicAccessor } from '../mnemonic';

export interface IPortfolioId extends Id {
    network: PortfolioNetworkType;
}

export class PortfolioIdMnemonicBased extends Id implements IPortfolioId {
    public static async create(
        mnemonicAccessor: IMnemonicAccessor,
        network: PortfolioNetworkType
    ): Promise<PortfolioIdMnemonicBased> {
        const mnemonicHash = xorFold16(
            Buffer.from(
                hmac(
                    sha512,
                    Buffer.from('SECRET_BASED_PORTFOLIO_ID'),
                    Buffer.from(mnemonicAccessor.value.join(' ').toLowerCase())
                )
            )
        );
        return new PortfolioIdMnemonicBased(mnemonicHash.toString('hex'), network);
    }
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
        return this.of('portfolio', PortfolioType.BIP39, this.hash, this.network);
    }

    public toJSON(): {
        hash: string;
        networkType: PortfolioNetworkType;
    } {
        return {
            hash: this.hash,
            networkType: this.network
        };
    }
}
