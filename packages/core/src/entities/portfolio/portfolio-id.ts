import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';

import { allowedPortfolioMetaEmojis, PortfolioMetaIconEmoji } from './portfolio-meta';
import { PortfolioNetworkType } from './portfolio-network-type';
import { xorFold16 } from '../../utils/crypto';
import { Id } from '../../utils/id';
import { IMnemonicAccessor } from '../mnemonic';
import { PortfolioType } from './I-portfolio';

export interface IPortfolioId extends Id {
    type: PortfolioType;
}

export class PortfolioIdMnemonicBased<PortfolioType extends PortfolioType.BIP39>
    extends Id
    implements IPortfolioId
{
    public static async create<T extends PortfolioType.BIP39>(
        type: T,
        mnemonicAccessor: IMnemonicAccessor,
        network: PortfolioNetworkType
    ): Promise<PortfolioIdMnemonicBased<T>> {
        const mnemonicHash = xorFold16(
            Buffer.from(
                hmac(
                    sha512,
                    Buffer.from('SECRET_BASED_PORTFOLIO_ID'),
                    Buffer.from(mnemonicAccessor.value.join(' ').toLowerCase())
                )
            )
        );
        return new PortfolioIdMnemonicBased(type, mnemonicHash.toString('hex'), network);
    }
    constructor(
        public readonly type: PortfolioType,
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
        return this.of('portfolio', 'seed', this.hash, this.network);
    }

    public toJSON(): {
        type: PortfolioType;
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
